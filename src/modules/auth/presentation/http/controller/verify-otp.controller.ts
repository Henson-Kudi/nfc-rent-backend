import { User } from '@prisma/client';
import { OTPType } from '@/common/enums';
import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { TokenDto } from '@/modules/auth/domain/dtos';
import { IController } from '@/types/global';
import { decryptData } from '@/common/utils/encryption';

class VerifyOTPController
  implements IController<Promise<IReturnValue<User & TokenDto>>>
{
  handle(request: Request) {
    console.log(request.body);

    const deviceName = request.deviceName;
    const location = request.deviceLocation;
    return authService.verifyOtp.execute({
      ...request.body,
      location,
      deviceName,
    });
  }
}

export default VerifyOTPController;
