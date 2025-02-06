import { gracefulShutdownCache } from './common/cache/redis-cache';
import { shutdownDbs } from './common/database';
import { gracefulShutdownMessageBroker } from './common/message-broker';
import logger from './common/utils/logger';

// Cleanup on shutdown
export async function cleanup() {
  logger.info('Shutting down gracefully...');
  // Disconnect from databases
  shutdownDbs();
  // Disconnect from cache
  gracefulShutdownCache();
  // Disconnect from message broker
  gracefulShutdownMessageBroker();

  // Exit process
  process.exit(0);
}
