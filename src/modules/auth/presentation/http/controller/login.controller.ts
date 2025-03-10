import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import { TokenDto } from '@/modules/auth/domain/dtos';
import { User } from '@/common/entities';
import { LoginType } from '@/common/enums';
import Container from 'typedi';

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
    const authService = Container.get(AuthService);
    const deviceName = request?.headers?.['x-device-name'];
    const location = request?.headers?.['x-device-location'];
    return authService.login({
      ...request.body,
      loginType: request?.body?.loginType || LoginType.EMAIL,
      location,
      deviceName,
    });
  }
}

export default LoginController;
