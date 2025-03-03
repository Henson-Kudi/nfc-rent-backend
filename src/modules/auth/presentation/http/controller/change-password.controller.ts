import { IReturnValue } from '@/common/utils';
import { Request } from 'express';

import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container, { Service } from 'typedi';

@Service()
class ChangePasswordController
  implements IController<Promise<IReturnValue<{ success: boolean }>>> {
  handle(request: Request) {
    const authService = Container.get(AuthService)
    const userId = request.headers?.['user-id'];

    return authService.changePassword({
      ...request.body,
      userId,
    });
  }
}

export default ChangePasswordController;
