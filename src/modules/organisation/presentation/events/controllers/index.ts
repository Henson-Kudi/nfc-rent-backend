import { MessageHandler } from '@/types/global';
import hanleCompanyCreated from './handle-company-created';
import handleUserRegisteredEvent from './user-registered';
import { subscriptions } from '../../../utils/messages.json'
import handleModuleInitialised from './module-initialised';


export const subscribeHandlers: Record<string, MessageHandler> = {
    [subscriptions.organisationCreated]: hanleCompanyCreated,
    [subscriptions.userRegistered]: handleUserRegisteredEvent,
    [subscriptions.moduleInitialised]: handleModuleInitialised,
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
