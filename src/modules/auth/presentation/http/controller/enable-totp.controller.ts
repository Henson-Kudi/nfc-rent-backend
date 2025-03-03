import { TOTPStatus } from '@prisma/client';
import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import { GeneratedSecret } from 'speakeasy';
import Container from 'typedi';
import { AuthService } from '@/modules/auth/application/services/auth.service';


class EnableTOTPController
  implements
  IController<
    Promise<
      IReturnValue<GeneratedSecret & { status: TOTPStatus; enabled: boolean }>
    >
  > {
  handle(request: Request) {
    const authService = Container.get(AuthService)
    return authService.enableOtp(
      (request.headers?.['user-id'] as string | undefined) || ''
    );
  }
}

export default EnableTOTPController;
