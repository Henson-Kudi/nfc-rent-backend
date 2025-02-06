import { AppError, IReturnValue } from '@/common/utils';
import { LoginDto, TokenDto } from '@/modules/auth/domain/dtos';
import IGoogleServicesManager, {
  IMessageBroker,
  ITokenManager,
  IUseCase,
} from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import IPasswordManager from '../providers/passwordManager';
import { LoginType, User } from '@prisma/client';
import defaultLogin from './defaultLogin';
import googleLogin from './google-login';
import { OTPType, ResponseCodes } from '@/common/enums';
import { loggedIn } from '../../utils/messageTopics.json';
import logger from '@/common/utils/logger';
import googleservicesManager from '@/config/google';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { encryptData } from '@/common/utils/encryption';
import { UserWithVerificationType } from '../../types';
import e from 'express';

class Login
  implements
  IUseCase<
    [LoginDto],
    IReturnValue<
      | (User & TokenDto)
      | {
        requiresOtp: boolean;
        token: string; // encrypted user object
      }
    >
  > {
  private readonly repository: IAuthUserRepository;
  private readonly messageBroker: IMessageBroker;
  private readonly passwordManager: IPasswordManager;
  private readonly tokenManager: ITokenManager;

  constructor(
    repo: IAuthUserRepository,
    messageBroker: IMessageBroker,
    passwordManager: IPasswordManager,
    tokenManager: ITokenManager
  ) {
    this.repository = repo;
    this.messageBroker = messageBroker;
    this.passwordManager = passwordManager;
    this.tokenManager = tokenManager;
  }

  async execute(data: LoginDto): Promise<
    IReturnValue<
      | (User & TokenDto)
      | {
        requiresOtp: boolean;
        token: string; // encrypted user object
      }
    >
  > {
    data = new LoginDto(data);

    // Validate login data
    await data.validate();

    let user: User | null = null;

    switch (data.loginType) {
      case LoginType.EMAIL:
        user = await defaultLogin(data, this.repository, this.passwordManager);
        break;

      case LoginType.GOOGLE:
        user = await googleLogin(
          data,
          this.repository,
          googleservicesManager.oAuthClient,
          this.messageBroker
        );
        break;

      default:
        throw new AppError({
          statusCode: ResponseCodes.BadRequest,
          message: 'Invalid login type',
        });
    }

    if (!user) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'Invalid credentials',
      });
    }

    // If user's email is not verified, ensure they verify before giving them access to platform
    if (!user.emailVerified) {
      try {
        // notification service will subscribe to this event. in case user requires otp, it'll generate an otp code for the user and send
        this.messageBroker.publishMessage<
          User & { requiresOtp: boolean; otpType: OTPType }
        >(loggedIn, {
          data: {
            ...user,
            requiresOtp: true,
            otpType: OTPType.EMAIL,
          },
        });
      } catch (err) {
        logger.error('Failed to send otp code', err);
      }

      const encData: UserWithVerificationType = {
        ...user,
        verificationType: OTPVERIFICATIONTYPES.EMAIL,
      };

      const encrypted = encryptData({
        data: encData,
      });

      return new IReturnValue({
        success: true,
        message: 'Email verification required',
        data: {
          requiresOtp: true,
          token: encrypted,
        },
      });
    }

    // Manage user sessions
    let session = await this.repository.findUserSession({
      where: {
        userId_device: {
          userId: user.id,
          device: data.deviceName,
        },
      },
    });

    // if session exist and token is not expired, then user still has a valid session and does not require otp validation.
    if (session) {
      try {
        this.tokenManager.verifyJwtToken('REFRESH_TOKEN', session.refreshToken);
      } catch (err) {
        // If its google login, create a new session
        if (data.loginType === LoginType.GOOGLE) {
          session = await this.repository.createUserSession({
            data: {
              device: data.deviceName,
              userId: user.id,
              refreshToken: '',
              expiresAt: new Date(),
              location: data?.location
            }
          })
        } else {
          this.messageBroker.publishMessage<
            User & { requiresOtp: boolean; otpType: OTPType }
          >(loggedIn, {
            data: {
              ...user,
              requiresOtp: true,
              otpType: OTPType.EMAIL,
            },
          });

          const encrypted = encryptData({
            data: {
              ...user,
              verificationType: OTPVERIFICATIONTYPES.OTP,
            },
          });
          // in case of error, means user needs revalidation
          return new IReturnValue({
            success: true,
            message: 'Login requires verification',
            data: {
              ...user,
              requiresOtp: true,
              token: encrypted,
            },
          });
        }

      }


    } else {
      if (data.loginType === LoginType.GOOGLE) {
        session = await this.repository.createUserSession({
          data: {
            device: data.deviceName,
            userId: user.id,
            refreshToken: '',
            expiresAt: new Date(),
            location: data?.location
          }
        })
      } else {
        this.messageBroker.publishMessage<
          User & { requiresOtp: boolean; otpType: OTPType }
        >(loggedIn, {
          data: {
            ...user,
            requiresOtp: true,
            otpType: OTPType.EMAIL,
          },
        });
        // in case there is no session, user needs otp verification
        const encrypted = encryptData({
          data: {
            ...user,
            verificationType: OTPVERIFICATIONTYPES.OTP,
          },
        });
        // in case of error, means user needs revalidation
        return new IReturnValue({
          success: true,
          message: 'Login requires verification',
          data: {
            ...user,
            requiresOtp: true,
            token: encrypted,
          },
        });
      }
    }

    // If we're means session is still valid. We need to refresh the session
    const accessToken = this.tokenManager.generateToken(
      'ACCESS_TOKEN',
      {
        userId: user?.id,
      },
      {}
    );

    const accessTokenExpiry = new Date(
      (this.tokenManager.decodeJwtToken(accessToken).exp as number) * 1000
    );

    const refreshToken = this.tokenManager.generateToken(
      'REFRESH_TOKEN',
      {
        userId: user?.id,
      },
      {}
    );

    session.refreshToken = refreshToken;
    const refreshTokenExpiry = new Date(
      (this.tokenManager.decodeJwtToken(refreshToken).exp as number) * 1000
    );
    session.expiresAt = refreshTokenExpiry;

    await this.repository.updateUserSession({
      where: {
        id: session.id,
      },
      data: session,
    });

    this.messageBroker.publishMessage<User>(loggedIn, {
      data: {
        ...user,
      },
    });

    return new IReturnValue({
      success: true,
      message: 'Login successfull',
      data: {
        ...user,
        accessToken: {
          value: accessToken,
          expireAt: accessTokenExpiry,
        },
        refreshToken: {
          value: refreshToken,
          expireAt: refreshTokenExpiry,
        },
      },
    });
  }
}

export default Login;
