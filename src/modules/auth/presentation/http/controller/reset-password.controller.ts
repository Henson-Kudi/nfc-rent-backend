import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { IController } from '@/types/global';

class ResetPasswordController
  implements IController<Promise<IReturnValue<{ sent: boolean }>>>
{
  handle(request: Request) {
    return authService.resetPassword.execute(request.body);
  }
}

export default ResetPasswordController;
