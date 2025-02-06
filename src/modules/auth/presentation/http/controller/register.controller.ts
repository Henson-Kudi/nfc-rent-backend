import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { IController } from '@/types/global';

class RegisterUserController
  implements
    IController<Promise<IReturnValue<{ requiresOtp: boolean; token: string }>>>
{
  handle(request: Request) {
    return authService.register.execute(request.body);
  }
}

export default RegisterUserController;
