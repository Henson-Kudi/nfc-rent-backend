import 'reflect-metadata';
/// <reference path="./types/global" />
/// <reference path="./types/global-imports" />

import startServer from './app';
import { cleanup } from './cleanup';
import { connectCache } from './common/cache/redis-cache';
import { connectMessageBroker } from './common/message-broker';
import subscribeToEvents from './modules/notifications/presentation/event-handlers/subscriptions';
import { subscriptions as authSubscriptions } from './modules/notifications/utils/message-topics.json';
import { initializeDb } from './common/database';
import { initializeDI } from './loaders/di';

// Run application
(async () => {
  // await runMigrations()

  // Connect to datasource before starting the server
  const datsSource = await initializeDb();

  initializeDI(datsSource);

  // const repo = Container.get(AddressMappingRepository)

  // const all = await (await repo.find()).map(async itm => await repo.update(itm.id, { derivationIndex: parseInt(itm.derivationPath.split('/').pop() || '0') }))

  // const roleRepo = Container.get(UserRepository)

  // const userRole = await roleRepo.findOne({ where: { email: 'amahkudi2@gmail.com' }, relations: ['roles'] })

  // console.log(userRole)

  // const fiat = await new HttpService().get('https://api.apilayer.com/exchangerates_data/latest?base=USD&symbols=EUR,GBP,USDT', {
  //   headers: {
  //     apikey: 'J7ow4oU1eXaGIoe3ovmUCSvlAeUv4Thp'
  //   }
  // })

  // console.log(fiat)

  // Make sure to seed modules before seeding roles
  // await seedModules(datsSource)

  // await seedDefaultRoles(dataSource)

  // Start server
  startServer();

  //   Connect to cache
  connectCache();

  // Connect to message broker
  connectMessageBroker().then(() => {
    // Subscribe to a channels here
    subscribeToEvents(authSubscriptions);
  });

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
