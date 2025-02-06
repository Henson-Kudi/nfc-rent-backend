import { IMessageBroker, IUseCase } from "@/types/global";
import { UpdateOrganisationDTO } from "../../domain/dtos";
import { AppError, IReturnValue } from "@/common/utils";
import { Organisation } from "@prisma/client";
import IOrganisationRepository from "../repositories";
import { DeFaultRoles, ResponseCodes } from "@/common/enums";
import slugify from "@/common/utils/slugify";
import { organisationUpdated } from '../../utils/messages.json'
import logger from "@/common/utils/logger";

class UpdateOrganisation implements IUseCase<[UpdateOrganisationDTO], IReturnValue<Organisation | null>> {
    constructor(private readonly repo: IOrganisationRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(data: UpdateOrganisationDTO): Promise<IReturnValue<Organisation | null>> {
        const validData = await new UpdateOrganisationDTO(data).validate()

        const orgNameSlug = slugify(validData.name)

        // Only owners can update organisation
        const isOwner = await this.repo.findCollaborator({
            where: {
                collaboratorId_organisationId: {
                    collaboratorId: validData.ownerId,
                    organisationId: validData.id
                },
                roles: {
                    has: DeFaultRoles.OWNER
                }
            }
        })

        if (!isOwner) {
            throw new AppError({
                message: "Insufficient permissions",
                statusCode: ResponseCodes.BadRequest,
            })
        }

        // Ensure user does not already have an organisation with this name
        const existingOrg = await this.repo.findOrganisation({
            where: {
                nameSlug_ownerId: {
                    nameSlug: orgNameSlug,
                    ownerId: validData.ownerId
                }
            }
        })

        if (existingOrg) {
            throw new AppError({
                message: `You already have an organisation with name ${validData.name}`,
                statusCode: ResponseCodes.BadRequest
            })
        }

        // Update and publish message
        const updated = await this.repo.updateorganisation({
            where: {
                nameSlug_ownerId: {
                    nameSlug: orgNameSlug,
                    ownerId: validData.ownerId
                },
                id: validData.id
            },
            data: {
                name: validData.name,
                nameSlug: slugify(validData.name)
            }
        })

        if (updated) {
            try {
                await this.messageBroker.publishMessage(organisationUpdated, { data: updated })
            } catch (error) {
                logger.error(`Failed to pubish ${organisationUpdated} event`, error)
            }
        }

        return new IReturnValue({
            message: "Organisation updated successfully",
            success: true,
            data: updated
        })
    }
}

export default UpdateOrganisation