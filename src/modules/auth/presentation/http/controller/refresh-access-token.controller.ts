import { User } from '@prisma/client';
import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { TokenDto } from '@/modules/auth/domain/dtos';
import { IController } from '@/types/global';

class RefreshAccessTokenController
  implements IController<Promise<IReturnValue<User & Partial<TokenDto>>>>
{
  handle(request: Request) {
    const deviceName =
      request?.deviceName || (request.headers?.['x-device-name'] as string);
    const location =
      request?.deviceLocation ||
      (request.headers?.['x-device-location'] as string);

    const refreshToken = request.cookies?.['refresh-token'];

    return authService.refreshAccessToken.execute(
      refreshToken || '',
      deviceName || '',
      location || ''
    );
  }
}

export default RefreshAccessTokenController;
