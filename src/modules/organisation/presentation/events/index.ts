import logger from '@/common/utils/logger';
import { subscriptions } from '../../utils/messages.json'
import factory from './controllers'
import messageBroker from '@/common/message-broker';

export function subscribeToEvents() {
    Object.values(subscriptions).map((val) => {
        const handler = factory.getMessageHandler(val);
        if (!handler) {
            logger.warn(`No event handler for: ${val}`);
        } else {
            messageBroker.subscribe(val, handler);
            logger.info(`Subscribed to ${val} channel successfully`);
        }
    });
}