import { TOTPStatus } from '@prisma/client';
import { AppError, IReturnValue } from '@/common/utils';
import { IUseCase } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import TOTPMFA from '../providers/totp';
import { ResponseCodes } from '@/common/enums';
import { GeneratedSecret } from 'speakeasy';

class EnableTOTP
  implements
    IUseCase<
      [string],
      IReturnValue<GeneratedSecret & { status: TOTPStatus; enabled: boolean }>
    >
{
  private readonly repository: IAuthUserRepository;
  private readonly totpProvider: TOTPMFA;

  constructor(repo: IAuthUserRepository, totpProvider: TOTPMFA) {
    this.repository = repo;
    this.totpProvider = totpProvider;
  }

  async execute(
    userId: string
  ): Promise<
    IReturnValue<GeneratedSecret & { status: TOTPStatus; enabled: boolean }>
  > {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'User not found',
      });
    }

    if (user.mfaEnabled || user.totpSecret) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'MFA already enabled for this user',
      });
    }

    const secret = this.totpProvider.generateSecret(user.email);

    user.mfaEnabled = true;
    user.totpSecret = secret.base32;
    user.totpStatus = TOTPStatus.REQUIRES_VERIFICATION;

    // update user
    await this.repository.updateUser({
      where: { id: user.id },
      data: user,
    });

    return new IReturnValue({
      success: true,
      message: 'MFA Set. Verify Token to enable MFA',
      data: {
        ...secret,
        enabled: user.mfaEnabled,
        status: user.totpStatus,
      },
    });
  }
}

export default EnableTOTP;
