import { gracefulShutdownCache } from './common/cache/redis-cache';
import { closeConnection } from './common/database';
import { gracefulShutdownMessageBroker } from './common/message-broker';
import logger from './common/utils/logger';

// Cleanup on shutdown
export async function cleanup(code: number) {
  console.log(code)
  logger.info('Shutting down gracefully...');
  // Disconnect from databases
  closeConnection();
  // Disconnect from cache
  gracefulShutdownCache();
  // Disconnect from message broker
  gracefulShutdownMessageBroker();

  // Exit process
  process.exit(0);
}
