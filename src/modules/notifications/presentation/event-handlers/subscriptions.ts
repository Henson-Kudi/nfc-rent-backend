import Container from 'typedi';
import eventHandlersFactory from './handlers';
import logger from '@/common/utils/logger';
import { MessageBrokerToken } from '@/common/message-broker';
import { AuthEvents } from '@/common/message-broker/events/auth.events';
import { UserEvents } from '@/common/message-broker/events/user.events';

export default function subscribeToEvents() {
  const messageBroker = Container.get(MessageBrokerToken);
  [AuthEvents.registered, UserEvents.loggedIn, UserEvents.requestOtp].map((val) => {
    const handler = eventHandlersFactory.getMessageHandler(val);
    if (!handler) {
      logger.warn(`No event handler for: ${val}`);
    } else {
      messageBroker.subscribe(val, handler);
      logger.info(`Subscribed to ${val} channel successfully`);
    }
  });
}
