import { DeFaultRoles, ResponseCodes } from "@/common/enums";
import messageBroker from "@/common/message-broker";
import { AppError } from "@/common/utils";
import logger from "@/common/utils/logger";
import { MessageHandler } from "@/types/global";
import { Organisation, User } from "@prisma/client";
import { organisationCreated } from '../../../utils/messages.json'
import { OrganisationRepository } from "@/modules/organisation/infrastrucure";
import slugify from "@/common/utils/slugify";
import { DefaultOrganisationName } from "@/common/constants";
import { ORGANISATION_MODULE_NAMES } from "@/common/utils/randomNumber";

const handleUserRegisteredEvent: MessageHandler = async (message, channel) => {
    try {
        const repo = new OrganisationRepository()

        const user: User = JSON.parse(message)?.data

        if (!user) {
            throw new AppError({
                statusCode: ResponseCodes.ServerError,
                message: 'No user data'
            })
        }

        // Create a default organisation for this user

        let company = await repo.findOrganisation({
            where: {
                nameSlug_ownerId: {
                    nameSlug: slugify(DefaultOrganisationName),
                    ownerId: user.id
                }
            }
        })

        console.log(company, 'found company')

        if (!company) {
            company = await repo.createOrganisation({
                data: {
                    name: DefaultOrganisationName,
                    nameSlug: slugify(DefaultOrganisationName),
                    ownerId: user.id,
                    collaborators: {
                        create: {
                            collaboratorId: user.id,
                            roles: [DeFaultRoles.OWNER]
                        }
                    },
                    modules: {
                        createMany: {
                            data: Object.values(ORGANISATION_MODULE_NAMES).map(val => ({
                                name: val,
                                nameSlug: slugify(val),
                            }))
                        }
                    }
                }
            })
        }

        //  Publish company created event. Since we have event handler for this, we'll let it manager the creation and initiaisation of a new db
        await messageBroker.publishMessage<Organisation & { isFirst: boolean }>(organisationCreated, { data: { ...company, isFirst: true } })


    } catch (err) {
        logger.error('Failed to handl company created event....', err)
    }
}

export default handleUserRegisteredEvent