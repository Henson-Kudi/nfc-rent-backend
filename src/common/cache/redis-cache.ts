import { createClient, RedisClientType } from 'redis';
import envConf from '../../config/env.conf';
import logger from '../utils/logger';

export class Cache {
  private client: RedisClientType;
  private readonly defaultTTL: number = 3600; // 1 hour in seconds
  private isconnected: boolean = false;

  constructor(redisUrl: string = envConf.REDIS_URL) {
    this.client = createClient({ url: redisUrl });
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.setEx(key, this.defaultTTL, value);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }

  async connect() {
    try {
      if (this.isconnected) {
        return;
      }
      await this.client.connect();
      this.isconnected = true;
      logger.info('Cache connected successfully');
    } catch (err) {
      logger.error('Cache connection error:', err);
    }

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }
}

const redisCache = new Cache();

export function connectCache(): Promise<void> {
  return redisCache.connect();
}

export function gracefulShutdownCache(): Promise<void> {
  logger.info('Disconnecting from cache...');
  return redisCache.quit();
}

export default redisCache;
