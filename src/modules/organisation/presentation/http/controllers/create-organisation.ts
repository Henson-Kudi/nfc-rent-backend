import { IReturnValue } from "@/common/utils";
import organisatinService from "@/modules/organisation/application/services";
import { IController } from "@/types/global";
import { Organisation } from "@prisma/client";
import { Request } from "express";

class CreateOrganisation implements IController<Promise<IReturnValue<Organisation>>> {
    handle(request: Request): Promise<IReturnValue<Organisation>> {
        const ownerId = request.headers?.['user-id'] || '';

        return organisatinService.createOrganisation.execute({
            ...request.body,
            ownerId,
        });
    }

}

export default CreateOrganisation

