import { IReturnValue } from '@/common/utils';

import { AuthService } from '@/modules/auth/application/services/auth.service';

import { Request } from 'express';
import Container from 'typedi';

class LogoutController
  implements IController<Promise<IReturnValue<{ success: boolean }>>>
{
  handle(request: Request): Promise<IReturnValue<{ success: boolean }>> {
    const authService = Container.get(AuthService);
    const deviceName = (request.headers?.['x-device-name'] || '') as string;
    const location = (request?.headers?.['x-device-location'] || '') as string;
    const userId = request?.headers?.['user-id'] as string;

    return authService.logout({
      ...request.body,
      userId,
      location,
      deviceName,
    });
  }
}

export default LogoutController;
