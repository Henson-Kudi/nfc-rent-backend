import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { IController } from '@/types/global';

class ChangePasswordController
  implements IController<Promise<IReturnValue<{ success: boolean }>>>
{
  handle(request: Request) {
    const userId = request.headers?.['user-id'];

    return authService.changePassword.execute({
      ...request.body,
      userId,
    });
  }
}

export default ChangePasswordController;
