import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import { AuthService } from '@/modules/auth/application/services/auth.service';
import { TokenDto } from '@/modules/auth/domain/dtos';
import { User } from '@/common/entities';
import Container from 'typedi';

class VerifyOTPController
  implements IController<Promise<IReturnValue<User & TokenDto>>> {
  handle(request: Request) {
    const authService = Container.get(AuthService)

    const deviceName = request?.headers?.['x-device-name'];
    const location = request?.headers?.['x-device-location'];
    return authService.verifyOtp({
      ...request.body,
      location,
      deviceName,
    });
  }
}

export default VerifyOTPController;
