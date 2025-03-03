import { Request } from 'express';
import { User } from '@/common/entities';
import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';

import { AuthService } from '@/modules/auth/application/services/auth.service';
import Container from 'typedi';

class GetAccountController
  implements IController<Promise<IReturnValue<User | null>>> {
  handle(request: Request): Promise<IReturnValue<User | null>> {
    const authService = Container.get(AuthService)
    const userId = request.headers?.['x-user-id'] as string;

    if (!userId) {
      return new Promise((res) => {
        res(
          new IReturnValue({
            success: false,
            error: new AppError({
              message: 'Unauthorised',
              statusCode: ResponseCodes.UnAuthorised,
            }),
            message: 'Unauthorised',
          })
        );
      });
    }

    return authService.getAccount(userId);
  }
}

export default GetAccountController;
