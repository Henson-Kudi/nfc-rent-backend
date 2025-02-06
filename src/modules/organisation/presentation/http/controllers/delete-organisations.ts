import { IReturnValue } from "@/common/utils";
import organisatinService from "@/modules/organisation/application/services";
import { IController } from "@/types/global";
import { Prisma } from "@prisma/client";
import { Request } from "express";

class DeleteOrganisations implements IController<Promise<IReturnValue<Prisma.BatchPayload>>> {
    handle(request: Request): Promise<IReturnValue<Prisma.BatchPayload>> {
        const ownerId = request.headers?.['user-id'] || '';
        const orgId = request.headers?.['x-organisation-id'] || ''

        return organisatinService.deleteOrganisations.execute({
            ...request.body,
            ownerId,
            ids: Array.isArray(orgId) ? orgId : [orgId]
        });
    }

}

export default DeleteOrganisations

