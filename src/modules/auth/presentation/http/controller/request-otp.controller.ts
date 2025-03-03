import { IReturnValue } from '@/common/utils';
import { Request } from 'express';

import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container from 'typedi';

class RequestOTPController
  implements IController<Promise<IReturnValue<{ sent: boolean, token: string }>>> {
  handle(request: Request) {
    const authService = Container.get(AuthService)
    return authService.requestOtp(request.body);
  }
}

export default RequestOTPController;
