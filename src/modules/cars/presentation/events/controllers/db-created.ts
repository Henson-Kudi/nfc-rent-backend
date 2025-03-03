import messageBroker from "@/common/message-broker";
import { MessageHandler } from "@/types/global";
import { moduleInitialised } from '../../../utils/messages.json'
import logger from "@/common/utils/logger";

const handleDbCreatedEvent: MessageHandler = async (msg, channel) => {
    try {
        const data = JSON.parse(msg)?.data as { organisationId: string }



        await messageBroker.publishMessage(moduleInitialised, { data: { name: 'products', organisationId: data?.organisationId, state: 'SUCCESS' } })
    } catch (err) {
        logger.error(err)
    }
}

export default handleDbCreatedEvent