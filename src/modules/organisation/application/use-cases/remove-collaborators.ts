import { IMessageBroker, IUseCase } from "@/types/global";
import { RemoveCollaboratorsDTO } from "../../domain/dtos";
import { AppError, IReturnValue } from "@/common/utils";
import { Prisma } from "@prisma/client";
import { DeFaultRoles, ResponseCodes } from "@/common/enums";
import IOrganisationRepository from "../repositories";
import { collaboratorsRemove } from '../../utils/messages.json'
import logger from "@/common/utils/logger";

class RemoveCollaborators implements IUseCase<[RemoveCollaboratorsDTO], IReturnValue<Prisma.BatchPayload>> {
    constructor(private readonly repo: IOrganisationRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(data: RemoveCollaboratorsDTO): Promise<IReturnValue<Prisma.BatchPayload>> {
        data = new RemoveCollaboratorsDTO(data)

        const validData = await data.validate()

        // User cannot remove self
        if (validData.collaborators.includes(validData.ownerId)) {
            throw new AppError({
                message: "Cannot remove self. Please use 'leave organisation' option instead.",
                statusCode: ResponseCodes.BadRequest
            })
        }

        // User perfoming action must have owner role
        const isOwner = await this.repo.findCollaborator({
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

        if (!isOwner) {
            throw new AppError({
                message: "Insufficient permissions to perform action",
                statusCode: ResponseCodes.BadRequest
            })
        }

        // Ensure that only the records whose collaboratorId is not the same as ownerId is being deleted.
        const removed = await this.repo.deleteCollaborators({
            where: {
                AND: [
                    {
                        collaboratorId: { in: validData.collaborators }
                    },
                    {
                        collaboratorId: { not: validData.ownerId }
                    }
                ]
            }
        })

        try {
            await this.messageBroker.publishMessage(collaboratorsRemove, {
                data: {
                    ...validData,
                    collaborators: validData.collaborators?.filter(item => item !== validData.ownerId),
                    ...removed
                }
            })
        } catch (err) {
            logger.error(`Failed to publish ${collaboratorsRemove} event`, err)
        }

        return new IReturnValue({
            message: "Collaborators removed successfully",
            success: true,
            data: removed
        })
    }

}

export default RemoveCollaborators