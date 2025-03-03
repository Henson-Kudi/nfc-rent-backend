import { Request } from 'express';
import { AppError, IReturnValue } from '@/common/utils';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container from 'typedi';
import { ResponseCodes } from '@/common/enums';

class UpdateAccountController
  implements
  IController<Promise<IReturnValue<{ id: string, updated: UpdateUserData }>>> {
  handle(request: Request) {
    const userId = request.headers?.['x-user-id'] || request?.user?.id

    if (!userId) {
      throw new AppError({
        message: "Forbidden",
        statusCode: ResponseCodes.Forbidden
      })
    }

    const authService = Container.get(AuthService)
    return authService.updateUser(userId, request.body);
  }
}

export default UpdateAccountController;
