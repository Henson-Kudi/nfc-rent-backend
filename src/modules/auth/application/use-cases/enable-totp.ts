import { AppError, IReturnValue } from '@/common/utils';
import TOTPMFA from '../providers/totp';
import { ResponseCodes, TOTPStatus } from '@/common/enums';
import { GeneratedSecret } from 'speakeasy';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

class EnableTOTP
  implements
  IUseCase<
    [string],
    IReturnValue<GeneratedSecret & { status: TOTPStatus; enabled: boolean }>
  > {

  constructor(
    private readonly repository: UserRepository,
    private readonly totpProvider: TOTPMFA
  ) { }

  async execute(
    userId: string
  ): Promise<
    IReturnValue<GeneratedSecret & { status: TOTPStatus; enabled: boolean }>
  > {
    const user = await this.repository.findOneBy({ id: userId });

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
    await this.repository.update({ id: user.id }, user);

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
