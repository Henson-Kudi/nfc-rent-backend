import { IReturnValue } from "@/common/utils";
import organisatinService from "@/modules/organisation/application/services";
import { IController } from "@/types/global";
import { Collaboration } from "@prisma/client";
import { Request } from "express";

class ChangeCollaboratorRoles implements IController<Promise<IReturnValue<Collaboration>>> {
    handle(request: Request): Promise<IReturnValue<Collaboration>> {
        const ownerId = request.headers?.['user-id'] || '';
        const orgId = request.headers?.['x-organisaion-id'] || ''

        return organisatinService.changeCollaboratorRoles.execute({
            ...request.body,
            ownerId: ownerId,
            organisationId: orgId,
        });
    }

}

export default ChangeCollaboratorRoles

