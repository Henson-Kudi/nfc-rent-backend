import { createClient, RedisClientType } from 'redis';
import envConf from '@/config/env.conf';
import logger from '../utils/logger';
import Container, { Service, Token } from 'typedi';

export const MessageBrokerToken = new Token<IMessageBroker>();
@Service({ id: MessageBrokerToken, global: true })
export class MessageBroker implements IMessageBroker {
  private subscriber: RedisClientType;
  private publisher: RedisClientType;
  private isSubscriberConnected: boolean = false;
  private isPublisherConnected: boolean = false;

  constructor() {
    this.subscriber = createClient({ url: envConf.REDIS_URL });
    this.publisher = createClient({ url: envConf.REDIS_URL });
  }

  private readonly defaultMessageHandler: MessageHandler = async (
    channel,
    message
  ) => {
    logger.warn(`No handler for message: ${message} from channel: ${channel}`);
  };

  // Publish message to a channel
  async publishMessage<Data = unknown>(
    channel: string,
    message: PublishedMessage<Data>
  ): Promise<void> {
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
      logger.info(`Message published to channel: ${channel}`);
    } catch (err) {
      logger.error('Error publishing message to Redis:', err);
    }
  }

  // Subscribe to a channel
  async subscribe(
    channel: string,
    callback: MessageHandler = this.defaultMessageHandler
  ): Promise<void> {
    return this.subscriber.subscribe(channel, callback);
  }

  async disconnect(): Promise<void> {
    await this.subscriber.disconnect();
    await this.publisher.disconnect();
  }

  async quit(): Promise<void> {
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  async connect() {
    try {
      if (!this.isPublisherConnected) {
        await this.publisher.connect();
        this.isPublisherConnected = true;
        logger.info('Publisher connected successfully');
      }
      if (!this.isSubscriberConnected) {
        await this.subscriber.connect();
        this.isSubscriberConnected = true;
        logger.info('Subscriber connected successfully');
      }

      logger.info('Message broker connected successfully');
    } catch (err) {
      logger.error('Redis connection error:', err);
    }

    this.publisher.on('error', (err) => {
      this.isPublisherConnected = false;
      logger.error('Publisher error:', err);
    });
    this.subscriber.on('error', (err) => {
      this.isSubscriberConnected = false;
      logger.error('Subscriber error:', err);
    });
  }
}

export function connectMessageBroker(): Promise<void> {
  return Container.get(MessageBrokerToken).connect();
}

export function gracefulShutdownMessageBroker(): Promise<void> {
  logger.info('Disconnecting from message broker...');
  return Container.get(MessageBrokerToken).quit();
}
