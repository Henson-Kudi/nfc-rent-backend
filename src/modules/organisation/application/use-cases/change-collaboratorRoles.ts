import { AppError, IReturnValue } from "@/common/utils";
import { IMessageBroker, IUseCase } from "@/types/global";
import { Collaboration } from "@prisma/client";
import { ChangeCollaboratorRolesDTO } from "../../domain/dtos";
import IOrganisationRepository from "../repositories";
import { DeFaultRoles, ResponseCodes } from "@/common/enums";
import { rolesChanged } from '../../utils/messages.json'
import logger from "@/common/utils/logger";

class ChangeCollaboratorRoles implements IUseCase<[ChangeCollaboratorRolesDTO], IReturnValue<Collaboration>> {
    constructor(private readonly repo: IOrganisationRepository, private readonly messageBroker: IMessageBroker) { }
    async execute(data: ChangeCollaboratorRolesDTO): Promise<IReturnValue<Collaboration>> {
        data = new ChangeCollaboratorRolesDTO(data)

        const validData = await data.validate()

        // Collaborator cannot change their own role
        if (validData.ownerId === validData.collaboratorId) {
            throw new AppError({
                message: "User cannot change his roles",
                statusCode: ResponseCodes.BadRequest
            })
        }

        // Person trying to perform this must have owner role
        const validOwner = await this.repo.findCollaborator({
            where: {
                collaboratorId_organisationId: {
                    collaboratorId: validData.ownerId,
                    organisationId: validData.organisationId
                },
                roles: {
                    has: DeFaultRoles.OWNER
                },
            }
        })

        if (!validOwner) {
            throw new AppError({
                statusCode: ResponseCodes.BadRequest,
                message: "Only user with owner role can perform this action"
            })
        }

        // change the roles of the said collaborator
        const updated = await this.repo.updateCollaborator({
            where: {
                collaboratorId_organisationId: {
                    collaboratorId: validData.collaboratorId,
                    organisationId: validData.organisationId
                }
            },
            data: {
                roles: validData.newRoles
            }
        })

        if (!updated) {
            throw new AppError({
                message: "Collaborator not found",
                statusCode: ResponseCodes.BadRequest
            })
        }

        try {
            await this.messageBroker.publishMessage<Collaboration>(rolesChanged, { data: updated })
        } catch (err) {
            logger.error(err)
        }

        return new IReturnValue({
            success: true,
            message: "Roles changed successfully",
            data: updated
        })


    }
}

export default ChangeCollaboratorRoles