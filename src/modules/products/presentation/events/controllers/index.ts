import { MessageHandler } from '@/types/global';
import { subscriptions } from '../../../utils/messages.json'
import handleDbCreatedEvent from './db-created';


export const subscribeHandlers: Record<string, MessageHandler> = {
    [subscriptions.databaseCreated]: handleDbCreatedEvent,
};

class Factory {
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

const eventHandlersFactory = new Factory();

export default eventHandlersFactory;
