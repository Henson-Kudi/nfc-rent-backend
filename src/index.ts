import "reflect-metadata"

import startServer from './app';
import { cleanup } from './cleanup';
import { connectCache } from './common/cache/redis-cache';
import { connectMessageBroker } from './common/message-broker';
import subscribeToEvents from './modules/notifications/presentation/event-handlers/subscriptions';
import { subscribeToEvents as orgSubs } from './modules/organisation/presentation/events';
import { subscriptions as authSubscriptions } from './modules/notifications/utils/message-topics.json';
import { registerShopEntities } from "./modules/organisation/domain/entities";
import { productServiceEventSubscriptions } from "./modules/products/presentation/events";
import { shopServiceEventSubscriptions } from "./modules/shops/presentation/events";

// Run application
(() => {
  // Conect to databases

  // Start server
  startServer();

  //   Connect to cache
  connectCache();

  // Connect to message broker
  connectMessageBroker().then(() => {
    // Subscribe to a channels here
    subscribeToEvents(authSubscriptions);

    // Organisation event subscriptions
    orgSubs()
    productServiceEventSubscriptions()
    shopServiceEventSubscriptions()
    // messageBroker.subscribe('channel1');
  });

  // Register multitenant entities
  registerShopEntities()

  // Start Cron Jobs
  // cronJobs()

  // Start Socket server
  // socketServer()

  // Graceful shutdown
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', cleanup);
  process.on('unhandledRejection', cleanup);
})();
