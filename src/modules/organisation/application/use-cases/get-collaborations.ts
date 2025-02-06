import { IUseCase, PaginationOptions } from "@/types/global";
import { GetCollabrationsQueryDTO } from "../../domain/dtos";
import { IReturnValueWithPagination } from "@/common/utils";
import { Collaboration } from "@prisma/client";
import IOrganisationRepository from "../repositories";

export class GetCollabrations implements IUseCase<[GetCollabrationsQueryDTO, PaginationOptions], IReturnValueWithPagination<Collaboration>> {
    constructor(private readonly repo: IOrganisationRepository) { }

    async execute(query: GetCollabrationsQueryDTO, options: PaginationOptions): Promise<IReturnValueWithPagination<Collaboration>> {
        query = new GetCollabrationsQueryDTO(query)

        const validQuery = await query.validate()

        const page = options?.page && !isNaN(Number(options?.page)) ? Number(options?.page) : 1
        const limit = options?.limit && !isNaN(Number(options?.limit)) && Number(options?.limit) < 100 ? Number(options?.limit) : 10
        const offset = (page - 1) * limit

        const count = await this.repo.countCollaborators({
            where: {
                collaboratorId: validQuery.collaboratorId,
                organisation: validQuery.search ? {
                    name: {
                        contains: validQuery.search,
                        mode: 'insensitive'
                    }
                } : undefined
            },
        })

        const found = await this.repo.findCollaborators({
            where: {
                collaboratorId: validQuery.collaboratorId,
                organisation: validQuery.search ? {
                    name: {
                        contains: validQuery.search,
                        mode: 'insensitive'
                    }
                } : undefined
            },
            include: {
                organisation: true
            },
            take: limit,
            skip: offset
        })

        return new IReturnValueWithPagination({
            success: true,
            message: "Collaborations fetched successfully",
            data: found,
            limit,
            page,
            total: count
        })
    }

}

export default GetCollabrations