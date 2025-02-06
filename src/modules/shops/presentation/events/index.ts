import logger from '@/common/utils/logger';
import { subscriptions } from '../../utils/messages.json'
import factory from './controllers'
import messageBroker from '@/common/message-broker';

export function shopServiceEventSubscriptions() {
    Object.values(subscriptions).map((val) => {
        const handler = factory.getMessageHandler(val);
        if (!handler) {
            logger.warn(`Shops: No event handler for: ${val}`);
        } else {
            messageBroker.subscribe(val, handler);
            logger.info(`Shops subscribed to ${val} channel successfully`);
        }
    });
}