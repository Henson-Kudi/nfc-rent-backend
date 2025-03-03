import Container from 'typedi';
import eventHandlersFactory from './handlers';
import logger from '@/common/utils/logger';
import { MessageBrokerToken } from '@/common/message-broker';

export default function subscribeToEvents(subs: Record<string, string>) {
  const messageBroker = Container.get(MessageBrokerToken)
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
