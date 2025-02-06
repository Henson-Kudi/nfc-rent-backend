import { IMessageBroker, IUseCase } from "@/types/global";
import { CreateOrganisationDTO } from "../../domain/dtos";
import { AppError, IReturnValue } from "@/common/utils";
import { Organisation } from "@prisma/client";
import IOrganisationRepository from "../repositories";
import { ORGANISATION_MODULE_NAMES } from "@/common/utils/randomNumber";
import slugify from "@/common/utils/slugify";
import { ResponseCodes } from "@/common/enums";
import { inviteCollaborators, organisationCreated } from '../../utils/messages.json'
import logger from "@/common/utils/logger";

class CreateOrganisation implements IUseCase<[CreateOrganisationDTO], IReturnValue<Organisation>> {
    constructor(private readonly repo: IOrganisationRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(data: CreateOrganisationDTO): Promise<IReturnValue<Organisation>> {
        data = new CreateOrganisationDTO(data)
        const validData = await data.validate()

        // Create and organisation and invite collaborators (if any) to the organisation
        const org = await this.repo.createOrganisation({
            data: {
                name: validData.name,
                nameSlug: validData.nameSlug,
                modules: {
                    createMany: {
                        data: Object.values(ORGANISATION_MODULE_NAMES).map(module => ({
                            name: module,
                            nameSlug: slugify(module)
                        }))
                    }
                },
                ownerId: validData.ownerId
            },
            include: {
                modules: true
            }
        })

        if (!org) {
            throw new AppError({
                message: "Failed to create organisation",
                statusCode: ResponseCodes.ServerError
            })
        }

        // If collaborators, create collaborator invitations and send invite to the users
        if (validData.collaborators) {
            // We need to change the structure of collaborators input data to {email?: string, phone?: string, roles?: string[]}[], where phone or email is required. User must add at least email or phone number. If no roles passed, when user accepts invitation, they'll be unable to access data. They'll need to request for a role to be granted before they can be able to access data.

            // Create collaborator invite

            // Publish invite collabrator
            try {
                await this.messageBroker.publishMessage(inviteCollaborators, { data: validData.collaborators })
            } catch (err) {
                logger.error(`Failed to publish ${inviteCollaborators}`, err)
            }
        }

        try {
            await this.messageBroker.publishMessage<Organisation>(organisationCreated, { data: org })
        } catch (err) {
            logger.error(`Failed to publish ${organisationCreated}`, err)
        }

        return new IReturnValue({
            success: true,
            message: `Organisation: ${validData.name} created successfully`,
            data: org
        })
    }

}

export default CreateOrganisation