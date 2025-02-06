import { TOTPStatus } from '@prisma/client';
import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { GeneratedSecret } from 'speakeasy';
import { IController } from '@/types/global';

class EnableTOTPController
  implements
    IController<
      Promise<
        IReturnValue<GeneratedSecret & { status: TOTPStatus; enabled: boolean }>
      >
    >
{
  handle(request: Request) {
    return authService.enableOtp.execute(
      (request.headers?.['user-id'] as string | undefined) || ''
    );
  }
}

export default EnableTOTPController;
