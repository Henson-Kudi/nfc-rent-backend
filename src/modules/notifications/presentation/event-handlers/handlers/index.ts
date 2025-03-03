import { subscriptions } from '../../../utils/message-topics.json';
import handleUserRegistereMessage from './auth.register';
import handleUserLoginMessage from './auth.login';
import handleRequestOtpMessage from './auth.request-otp';

const subscribeHandlers: Record<string, MessageHandler> = {
  [subscriptions.userRegistered]: handleUserRegistereMessage,
  [subscriptions.loggedIn]: handleUserLoginMessage,
  [subscriptions.requestOtp]: handleRequestOtpMessage
};

class EventHandlersFactory {
  private handler: Map<string, MessageHandler> = new Map();

  constructor() {
    Object.entries(subscribeHandlers).map(([key, value]) => {
      this.registerHandler(key, value);
    });
  }

  getMessageHandler(name: string) {
    return this.handler.get(name);
  }

  registerHandler(name: string, handler: MessageHandler) {
    this.handler.set(name, handler);
  }
}

const eventHandlersFactory = new EventHandlersFactory();

export default eventHandlersFactory;
