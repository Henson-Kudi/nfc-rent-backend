import logger from '@/common/utils/logger';
import { subscriptions } from '../../utils/messages.json';
import factory from './controllers';
import messageBroker from '@/common/message-broker';

export function productServiceEventSubscriptions() {
  Object.values(subscriptions).map((val) => {
    const handler = factory.getMessageHandler(val);
    if (!handler) {
      logger.warn(`Products: No event handler for: ${val}`);
    } else {
      messageBroker.subscribe(val, handler);
      logger.info(`Products subscribed to ${val} channel successfully`);
    }
  });
}
