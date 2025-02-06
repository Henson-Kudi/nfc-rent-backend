import { IReturnValue } from '@/common/utils';
import { Request } from 'express';
import authService from '@/modules/auth/application/services/auth-service';
import { IController } from '@/types/global';

class RequestOTPController
  implements IController<Promise<IReturnValue<{ sent: boolean, token: string }>>> {
  handle(request: Request) {
    return authService.requestOtp.execute(request.body);
  }
}

export default RequestOTPController;
