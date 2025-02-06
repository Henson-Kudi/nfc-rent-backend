import { User } from '@prisma/client';
import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { TokenDto } from '@/modules/auth/domain/dtos';
import { IController } from '@/types/global';

class LoginController
  implements
    IController<
      Promise<
        IReturnValue<
          | (User & TokenDto)
          | {
              requiresOtp: boolean;
              token: string; // encrypted user object
            }
        >
      >
    >
{
  handle(request: Request) {
    const deviceName = request.deviceName;
    const location = request.deviceLocation;
    return authService.login.execute({
      ...request.body,
      location,
      deviceName,
    });
  }
}

export default LoginController;
