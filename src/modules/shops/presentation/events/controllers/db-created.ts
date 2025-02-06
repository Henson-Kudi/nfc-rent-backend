import messageBroker from "@/common/message-broker";
import { MessageHandler } from "@/types/global";
import { moduleInitialised } from '../../../utils/messages.json'
import { getTenantDataSource } from "@/common/database/typeorm";
import { AppError } from "@/common/utils";
import logger from "@/common/utils/logger";
import { Shop } from "@/modules/organisation/domain/entities";

const handleDbCreatedEvent: MessageHandler = async (msg, channel) => {
    try {
        const data = JSON.parse(msg)?.data as { name: string, organisationId: string }

        if (!data.name) {
            throw new AppError({
                statusCode: 400,
                message: 'Invalid database data'
            })
        }

        const dataSource = await getTenantDataSource(data.name)

        if (!dataSource.isInitialized) {
            logger.info('Datasource not initialised correctly')
        } else {
            console.log('Datasource initialised correctly')
        }

        const shopRepo = dataSource.getRepository(Shop)

        console.log('shopRepo gotten')

        const newShop = shopRepo.create({
            name: 'Default Shop',
        })

        console.log(newShop, 'new shop')

        await shopRepo.save(newShop)

        logger.info('Shop data saved')

        await messageBroker.publishMessage(moduleInitialised, { data: { name: 'shops', organisationId: data?.organisationId, state: 'SUCCESS' } })
    } catch (err) {
        logger.error(err)
    }
}

export default handleDbCreatedEvent