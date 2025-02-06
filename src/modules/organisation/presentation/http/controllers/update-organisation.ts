import { IReturnValue } from "@/common/utils";
import organisatinService from "@/modules/organisation/application/services";
import { IController } from "@/types/global";
import { Organisation } from "@prisma/client";
import { Request } from "express";

class UpdateOrganisation implements IController<Promise<IReturnValue<Organisation | null>>> {
    handle(request: Request): Promise<IReturnValue<Organisation | null>> {
        const ownerId = request.headers?.['user-id'] || '';
        const orgId = request.headers?.['x-organisation-id'] || ''

        return organisatinService.updateOrganisation.execute({
            ...request.body,
            id: orgId,
            ownerId
        });
    }

}

export default UpdateOrganisation

