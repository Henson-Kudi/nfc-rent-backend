import { IReturnValue } from "@/common/utils";
import authService from "@/modules/auth/application/services/auth-service";
import { IController } from "@/types/global";
import { Request } from "express";

class LogoutController implements IController<Promise<IReturnValue<{ success: boolean }>>> {
    handle(request: Request): Promise<IReturnValue<{ success: boolean; }>> {
        const deviceName = (request.headers?.['x-device-name'] || request?.deviceName) as string;
        const location = (request?.headers?.['x-device-location'] || request?.deviceLocation) as string;
        const userId = request?.headers?.['user-id'] as string;

        return authService.logout.execute({
            ...request.body,
            userId,
            location,
            deviceName,
        });
    }

}

export default LogoutController