import { IReturnValueWithPagination } from "@/common/utils";
import organisatinService from "@/modules/organisation/application/services";
import { GetCollabrationsQueryDTO } from "@/modules/organisation/domain/dtos";
import { IController } from "@/types/global";
import { Collaboration } from "@prisma/client";
import { Request } from "express";

class GetCollaborations implements IController<Promise<IReturnValueWithPagination<Collaboration | null>>> {
    handle(request: Request): Promise<IReturnValueWithPagination<Collaboration | null>> {
        const ownerId = request.headers?.['user-id'] || '';
        const page = request?.query?.page && !isNaN(Number(request?.query?.page)) ? Number(request?.query?.page) : 1
        const limit = request?.query?.limit && !isNaN(Number(request?.query?.limit)) && Number(request?.query?.limit) < 100 ? Number(request?.query?.limit) : 10

        const query = new GetCollabrationsQueryDTO({
            collaboratorId: ownerId as string,
            search: request?.query?.search as string,
        })

        return organisatinService.getCollabrations.execute(query, {
            page,
            limit,
        });
    }

}

export default GetCollaborations

