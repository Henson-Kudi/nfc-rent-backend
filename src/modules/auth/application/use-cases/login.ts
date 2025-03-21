import { AppError, IReturnValue } from '@/common/utils';
import { LoginDto, TokenDto } from '@/modules/auth/domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import defaultLogin from './defaultLogin';
import googleLogin from './google-login';
import { LoginType, OTPType, ResponseCodes } from '@/common/enums';
import { loggedIn } from '../../utils/messageTopics.json';
import logger from '@/common/utils/logger';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { encryptData } from '@/common/utils/encryption';
import { User } from '@/common/entities';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { instanceToPlain } from 'class-transformer';
class Login
  implements
    IUseCase<
      [LoginData],
      IReturnValue<
        | (User & TokenDto)
        | {
            requiresOtp: boolean;
            token: string; // encrypted user object
          }
      >
    >
{
  constructor(
    private readonly repository: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly messageBroker: IMessageBroker,
    private readonly passwordManager: IPasswordManager,
    private readonly tokenManager: ITokenManager,
    private readonly googleservicesManager: IGoogleServicesManager
  ) {}

  async execute(input: LoginData): Promise<
    IReturnValue<
      | (User & TokenDto)
      | {
          requiresOtp: boolean;
          token: string; // encrypted user object
        }
    >
  > {
    const data = new LoginDto(input);

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
          this.googleservicesManager.oAuthClient,
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

    user = instanceToPlain(user) as User;

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
          } as User & { requiresOtp: boolean; otpType: OTPType },
        });
      } catch (err) {
        logger.error('Failed to send otp code', err);
      }

      const encData = {
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
    let session = await this.sessionRepo.findOne({
      where: {
        userId: user.id,
        device: data.deviceName,
      },
    });

    // if session exist and token is not expired, then user still has a valid session and does not require otp validation.
    if (session) {
      try {
        this.tokenManager.verifyJwtToken('REFRESH_TOKEN', session.refreshToken);
      } catch (_) {
        // If its google login, create a new session
        if (data.loginType === LoginType.GOOGLE) {
          session = this.sessionRepo.create({
            device: data.deviceName,
            userId: user.id,
            refreshToken: '',
            expiresAt: new Date(),
            location: data?.location,
          });
          await this.sessionRepo.save(session);
        } else {
          this.messageBroker.publishMessage<
            User & { requiresOtp: boolean; otpType: OTPType }
          >(loggedIn, {
            data: {
              ...user,
              requiresOtp: true,
              otpType: OTPType.EMAIL,
            } as User & { requiresOtp: boolean; otpType: OTPType },
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
        session = await this.sessionRepo.create({
          device: data.deviceName,
          userId: user.id,
          refreshToken: '',
          expiresAt: new Date(),
        });

        await this.sessionRepo.save(session);
      } else {
        this.messageBroker.publishMessage<
          User & { requiresOtp: boolean; otpType: OTPType }
        >(loggedIn, {
          data: {
            ...user,
            requiresOtp: true,
            otpType: OTPType.EMAIL,
          } as User & { requiresOtp: boolean; otpType: OTPType },
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

    session = await this.sessionRepo.save(session);

    this.messageBroker.publishMessage<User>(loggedIn, {
      data: user,
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
    }) as IReturnValue<
      | (User & TokenDto)
      | {
          requiresOtp: boolean;
          token: string; // encrypted user object
        }
    >;
  }
}

export default Login;
