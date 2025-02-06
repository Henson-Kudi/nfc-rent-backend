import { AppError, IReturnValue } from "@/common/utils";
import { IMessageBroker, IUseCase } from "@/types/global";
import { Prisma } from "@prisma/client";
import { DeleteOrganisationsDTO } from "../../domain/dtos";
import IOrganisationRepository from "../repositories";
import { DeFaultRoles, ResponseCodes } from "@/common/enums";
import { organisationsDeleted } from '../../utils/messages.json'
import logger from "@/common/utils/logger";

class DeleteOrganisations implements IUseCase<[DeleteOrganisationsDTO], IReturnValue<Prisma.BatchPayload>> {
    constructor(private readonly repo: IOrganisationRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(query: DeleteOrganisationsDTO): Promise<IReturnValue<Prisma.BatchPayload>> {
        query = new DeleteOrganisationsDTO(query)

        const validData = await query.validate()

        // User must be owner in order to be able to delete orgaisation
        const organisationsCount = await this.repo.countCollaborators({
            where: {
                collaboratorId: validData.ownerId,
                organisationId: {
                    in: validData.ids
                },
                roles: {
                    has: DeFaultRoles.OWNER
                }
            }
        })

        if (organisationsCount < validData.ids.length) {
            throw new AppError({
                message: "User must have owner role in all organisations",
                statusCode: ResponseCodes.BadRequest
            })
        }

        // Delete organisations
        const deleted = await this.repo.deleteOrganisations({
            where: {
                id: {
                    in: validData.ids
                }
            }
        })

        try {
            await this.messageBroker.publishMessage(organisationsDeleted, {
                data: {
                    ...deleted,
                    ...validData
                }
            })
        } catch (error) {
            logger.error(`Failed to publish ${organisationsDeleted} event`, error)
        }

        return new IReturnValue({
            success: true,
            message: "Organisations deleted successfull",
            data: deleted
        })
    }

}

export default DeleteOrganisations