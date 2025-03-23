import { AppError, IReturnValue } from '@/common/utils';
import IPasswordManager from '../providers/passwordManager';
import { OTPVerificationDto, TokenDto } from '@/modules/auth/domain/dtos';
import { ResponseCodes, TOTPStatus } from '@/common/enums';
import TOTPMFA from '../providers/totp';
import { decryptData } from '@/common/utils/encryption';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { UserWithVerificationType } from '../../types';
import { User } from '@/common/entities';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { OTPRepository } from '../../infrastructure/repositories/otp.repository';
import { instanceToPlain } from 'class-transformer';

class VerifyOtp
  implements IUseCase<[OTPValidationData], IReturnValue<User & TokenDto>> {
  constructor(
    private readonly repository: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly otpRepo: OTPRepository,
    private readonly passwordManager: IPasswordManager,
    private readonly totpProvider: TOTPMFA,
    private readonly tokenManager: ITokenManager
  ) { }

  async execute(
    params: OTPValidationData
  ): Promise<IReturnValue<User & TokenDto>> {
    const data = new OTPVerificationDto(params);

    const validData = await data.validate();

    let user: User | null = null;

    // If we're receiving token, then it is not a mfa. mfa should only send code and userId.
    if (validData.token) {
      const decrypted = decryptData<UserWithVerificationType>(validData.token);

      const otp = await this.otpRepo.findOneBy({
        userId: decrypted.id,
      });

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

      user = await this.repository.findOneBy({ id: decrypted.id });

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
        await this.repository.update(
          { id: decrypted.id },
          { emailVerified: true }
        );
        user.emailVerified = true;
      } else if (
        decrypted.verificationType === OTPVERIFICATIONTYPES.PHONE &&
        !user.phoneVerified && user.phone
      ) {
        await this.repository.update(
          { id: decrypted.id },
          { phoneVerified: true }
        );
        user.phoneVerified = true;
      }

      await this.otpRepo.delete({ id: otp.id });
    } else if (validData.userId) {
      let User = await this.repository.findOneBy({ id: validData.userId });

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
        await this.repository.update(
          { id: User.id },
          { totpStatus: TOTPStatus.ENABLED }
        );
        User.totpStatus = TOTPStatus.ENABLED;
      }

      user = User;
    }

    if (!user) {
      throw new AppError({
        message: 'Invalid otp',
        statusCode: ResponseCodes.BadRequest,
      });
    }

    user = instanceToPlain(user) as User;

    // If otp is valid then we're good to go and sign a session
    let session = await this.sessionRepo.findOneBy({
      userId: user.id,
      device: validData.deviceName,
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
      session = this.sessionRepo.create({
        device: validData.deviceName,
        location: validData.location,
        userId: user.id,
        refreshToken: refreshToken,
        expiresAt: refreshTokenExpiry,
        isActive: true,
        lastActiveAt: new Date(),
      });

      isNewSession = true;
    } else {
      session.refreshToken = refreshToken;
      session.expiresAt = refreshTokenExpiry;
      session.lastActiveAt = new Date();
    }

    session = await this.sessionRepo.save(session);

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
    }) as IReturnValue<User & TokenDto>;
  }
}

export default VerifyOtp;
