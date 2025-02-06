import { AppError, IReturnValue } from '@/common/utils';
import { ITokenManager, IUseCase } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import IPasswordManager from '../providers/passwordManager';
import { TOTPStatus, User } from '@prisma/client';
import { OTPVerificationDto, TokenDto } from '@/modules/auth/domain/dtos';
import { ResponseCodes } from '@/common/enums';
import TOTPMFA from '../providers/totp';
import { decryptData } from '@/common/utils/encryption';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { UserWithVerificationType } from '../../types';

class VerifyOtp implements IUseCase<[OTPVerificationDto], IReturnValue<User & TokenDto>> {
  private readonly repository: IAuthUserRepository;
  private readonly passwordManager: IPasswordManager;
  private readonly totpProvider: TOTPMFA;
  private readonly tokenManager: ITokenManager;

  constructor(
    repo: IAuthUserRepository,
    passwordManager: IPasswordManager,
    totpProvider: TOTPMFA,
    tokenManager: ITokenManager
  ) {
    this.repository = repo;
    this.passwordManager = passwordManager;
    this.totpProvider = totpProvider;
    this.tokenManager = tokenManager;
  }

  async execute(
    params: OTPVerificationDto
  ): Promise<IReturnValue<User & TokenDto>> {
    const data = new OTPVerificationDto(params);

    const validData = await data.validate();

    let user: User | null = null;

    // If we're receiving token, then it is not a mfa. mfa should only send code and userId.
    if (validData.token) {
      const decrypted = decryptData<UserWithVerificationType>(validData.token);

      const otp = await this.repository.getOtpCodeByUserId(decrypted.id);

      if (!otp || !validData.token) {
        throw new AppError({
          message: 'Invalid otp code',
          statusCode: ResponseCodes.BadRequest,
        });
      }

      const otpVerified = await this.passwordManager.comparePasswords(
        validData.code,
        otp.token
      );

      if (!otpVerified) {
        throw new AppError({
          statusCode: ResponseCodes.BadRequest,
          message: 'Invalid otp',
        });
      }

      user = await this.repository.findById(decrypted.id, {
        include: {
          collaborations: {
            include: {
              organisation: true
            }
          }
        }
      });

      if (!user) {
        throw new AppError({
          statusCode: ResponseCodes.BadRequest,
          message: 'Invalid otp',
        });
      }


      if (
        decrypted.verificationType === OTPVERIFICATIONTYPES.EMAIL &&
        !user.emailVerified
      ) {
        user = await this.repository.updateUser({
          where: { id: decrypted.id },
          data: { emailVerified: true },
          include: {
            collaborations: {
              include: {
                organisation: true
              }
            }
          }
        });
      } else if (
        decrypted.verificationType === OTPVERIFICATIONTYPES.PHONE &&
        !user.phoneVerified
      ) {
        user = await this.repository.updateUser({
          where: { id: decrypted.id },
          data: { phoneVerified: true },
          include: {
            collaborations: {
              include: {
                organisation: true
              }
            }
          }
        });
      }

      await this.repository.deleteOtpTokens({ where: { id: otp.id } });
    } else if (validData.userId) {
      let User = await this.repository.findById(validData.userId, {
        include: {
          collaborations: {
            include: {
              organisation: true
            }
          }
        }
      });

      if (!User || !User.mfaEnabled || !User?.totpSecret) {
        throw new AppError({
          statusCode: ResponseCodes.BadRequest,
          message: 'Failed to verify otp',
        });
      }

      const otpVerified = this.totpProvider.verifyOtp(
        validData.code,
        User.totpSecret
      );

      if (!otpVerified) {
        throw new AppError({
          message: 'Invalid otp code',
          statusCode: ResponseCodes.BadRequest,
        });
      }

      if (User.totpStatus === TOTPStatus.REQUIRES_VERIFICATION) {
        User = await this.repository.updateUser({
          where: { id: User.id },
          data: {
            totpStatus: TOTPStatus.ENABLED,
          },
          include: {
            collaborations: {
              include: {
                organisation: true
              }
            }
          }
        });
      }

      user = User;
    }

    if (!user) {
      throw new AppError({
        message: 'Invalid otp',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    // If otp is valid then we're good to go and sign a session
    let session = await this.repository.findUserSession({
      where: {
        userId_device: {
          userId: user.id,
          device: validData.deviceName,
        },
      },
    });

    let isNewSession = false;

    const accessToken = this.tokenManager.generateToken(
      'ACCESS_TOKEN',
      { userId: user.id },
      {}
    );

    const refreshToken = this.tokenManager.generateToken(
      'REFRESH_TOKEN',
      { userId: user.id },
      {}
    );

    const decodedRefreshToken = this.tokenManager.decodeJwtToken(refreshToken);
    const refreshTokenExpiry = new Date(
      (decodedRefreshToken.exp as number) * 1000
    );

    const decodedAccessToken = this.tokenManager.decodeJwtToken(accessToken);
    const accessTokenExpiry = new Date(
      (decodedAccessToken.exp as number) * 1000
    );

    if (!session) {
      session = await this.repository.createUserSession({
        data: {
          device: validData.deviceName,
          location: validData.location,
          userId: user.id,
          refreshToken: refreshToken,
          expiresAt: refreshTokenExpiry,
          isActive: true,
          lastActiveAt: new Date(),
        },
      });

      isNewSession = true;
    } else {
      session.refreshToken = refreshToken;
      session.expiresAt = refreshTokenExpiry;
      session.lastActiveAt = new Date();
    }

    if (!isNewSession) {
      session = await this.repository.updateUserSession({
        where: { id: session.id },
        data: session,
      });
    }

    return new IReturnValue({
      success: true,
      message: 'Otp verified successfully',
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

export default VerifyOtp;
