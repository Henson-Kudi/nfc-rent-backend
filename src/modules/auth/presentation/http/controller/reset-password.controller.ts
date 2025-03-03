import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container from 'typedi';

class ResetPasswordController
  implements IController<Promise<IReturnValue<{ sent: boolean }>>> {
  handle(request: Request) {
    const authService = Container.get(AuthService)
    return authService.resetPassword(request.body);
  }
}

export default ResetPasswordController;
