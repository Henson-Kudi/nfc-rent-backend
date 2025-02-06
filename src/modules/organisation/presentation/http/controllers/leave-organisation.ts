import { IReturnValue } from "@/common/utils";
import organisatinService from "@/modules/organisation/application/services";
import { IController } from "@/types/global";
import { Collaboration } from "@prisma/client";
import { Request } from "express";

class LeaveOrganisation implements IController<Promise<IReturnValue<Collaboration | null>>> {
    handle(request: Request): Promise<IReturnValue<Collaboration | null>> {
        const ownerId = request.headers?.['user-id'] || '';
        const orgId = request.headers?.['x-organisation-id'] || ''

        return organisatinService.leaveOrganisation.execute({
            ...request.body,
            id: orgId,
            collaboratorId: ownerId
        });
    }

}

export default LeaveOrganisation

