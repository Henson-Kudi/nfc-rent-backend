import eventHandlersFactory from './handlers';
import messageBroker from '@/common/message-broker';
import logger from '@/common/utils/logger';

export default function subscribeToEvents(subs: Record<string, string>) {
  Object.values(subs).map((val) => {
    const handler = eventHandlersFactory.getMessageHandler(val);
    if (!handler) {
      logger.warn(`No event handler for: ${val}`);
    } else {
      messageBroker.subscribe(val, handler);
      logger.info(`Subscribed to ${val} channel successfully`);
    }
  });
}
