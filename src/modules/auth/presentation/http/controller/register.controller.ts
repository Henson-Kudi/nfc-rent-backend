import { Request } from 'express';
import { IReturnValue } from '@/common/utils';

import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container from 'typedi';

class RegisterUserController
  implements
  IController<Promise<IReturnValue<{ requiresOtp: boolean; token: string }>>> {
  handle(request: Request) {
    const authService = Container.get(AuthService)
    return authService.register(request.body);
  }
}

export default RegisterUserController;
