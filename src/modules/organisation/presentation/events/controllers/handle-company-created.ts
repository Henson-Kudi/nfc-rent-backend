import { createTenantDatabase } from "@/common/database/typeorm";
import { ResponseCodes } from "@/common/enums";
import messageBroker from "@/common/message-broker";
import { AppError } from "@/common/utils";
import logger from "@/common/utils/logger";
import { MessageHandler } from "@/types/global";
import { Organisation } from "@prisma/client";
import { databaseCreated } from '../../../utils/messages.json'

const hanleCompanyCreated: MessageHandler = async (message, channel) => {
    try {
        const company: Organisation = JSON.parse(message)?.data

        if (!company) {
            throw new AppError({
                statusCode: ResponseCodes.ServerError,
                message: 'No company data'
            })
        }

        const dbName = `${company.id}`

        // When new company is crated:
        // 1. Connect to admin database
        // 2. Create its tenant db
        // 3. save db connection data in cache
        // 4. publish event of db initialised with db name. so that modules like roles, products, etc would listen and initialised their schemas
        // 5.

        // Create tenant db
        await createTenantDatabase(dbName)

        //  Publish database created event
        await messageBroker.publishMessage<{ name: string, organisationId: string }>(databaseCreated, { data: { name: dbName, organisationId: company.id } })

        // Update organisations status to ready
        // if (company.state === OrganisationState.CREATED) {
        //     await repo.updateorganisation({
        //         where: { id: company.id },
        //         data: {
        //             state: OrganisationState.DB_INITIALISED
        //         }
        //     })
        // }


    } catch (err) {
        logger.error('Failed to handl company created event....', err)
    }
}

export default hanleCompanyCreated