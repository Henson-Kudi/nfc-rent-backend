import { Request } from 'express';
import { AppError, IReturnValue } from '@/common/utils';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container from 'typedi';
import { ResponseCodes } from '@/common/enums';

class DeleteAccountController
  implements IController<Promise<IReturnValue<boolean>>>
{
  handle(request: Request) {
    const userId = request.headers?.['x-user-id'] || request?.user?.id;

    if (!userId) {
      throw new AppError({
        message: 'Forbidden',
        statusCode: ResponseCodes.Forbidden,
      });
    }

    const authService = Container.get(AuthService);
    return authService.softDeleteUser(userId);
  }
}

export default DeleteAccountController;
