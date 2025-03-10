import { IReturnValue } from '@/common/utils';
import { Request } from 'express';

import { AuthService } from '@/modules/auth/application/services/auth.service';

import { TokenDto } from '@/modules/auth/domain/dtos';
import { User } from '@/common/entities';
import Container from 'typedi';

class RefreshAccessTokenController
  implements IController<Promise<IReturnValue<User & Partial<TokenDto>>>>
{
  handle(request: Request) {
    const authService = Container.get(AuthService);
    const deviceName = request.headers?.['x-device-name'] as string;
    const location = request.headers?.['x-device-location'] as string;

    const refreshToken = request.cookies?.['refresh-token'];

    return authService.refreshAccessToken(
      refreshToken || '',
      deviceName || '',
      location || ''
    );
  }
}

export default RefreshAccessTokenController;
