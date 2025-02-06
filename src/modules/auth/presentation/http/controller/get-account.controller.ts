import { ResponseCodes } from '@/common/enums';
import { AppError, IReturnValue } from '@/common/utils';
import authService from '@/modules/auth/application/services/auth-service';
import { IController } from '@/types/global';
import { User } from '@prisma/client';
import { Request } from 'express';

class GetAccountController
  implements IController<Promise<IReturnValue<User | null>>>
{
  handle(request: Request): Promise<IReturnValue<User | null>> {
    const userId = request.headers?.['user-id'] as string;

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

    return authService.getAccount.execute(userId);
  }
}

export default GetAccountController;
