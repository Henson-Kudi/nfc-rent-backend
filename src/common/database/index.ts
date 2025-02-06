import redisCache from '../cache/redis-cache';
import { MemoryCache } from '../cache/memory-cache';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const defaultClientName = 'default-prisma-client'

// Define LRU cache options for prisma clients. This cache will store up to 50 Prisma clients with a 20-minutes TTL. Since this is multi-tenant, we need to ensure that we don't cache too many clients and that we don't keep them in memory for too long.
const prismaClients = new MemoryCache<string, PrismaClient>({
  max: 50, // Maximum number of Prisma clients to cache (50 vendors/tenants)
  ttl: 1000 * 60 * 20, // Time-to-live: 20 minutes
  dispose: async (client, vendorId) => {
    logger.info(`Disconnecting from database for vendor: ${vendorId}`);
    await client.$disconnect(); // Gracefully disconnect PrismaClient
  },
});

// Function to get Prisma client for a vendor
async function getPrismaClient(vendorId: string): Promise<PrismaClient> {
  if (prismaClients.has(vendorId)) {
    return prismaClients.get(vendorId)!; // Return cached client if exists
  }

  // Fetch DB URL from Redis
  const dbUrl = await redisCache.get<string>(`vendor:${vendorId}:dbUrl`);
  if (!dbUrl) {
    throw new Error(`Database URL not found for vendor: ${vendorId}`);
  }

  // Create a new Prisma client
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  // Cache the new Prisma client
  prismaClients.set(vendorId, prisma);

  return prisma;
}

function getDefaultPrismaClient(): PrismaClient {

  if (prismaClients.has(defaultClientName)) {
    return prismaClients.get(defaultClientName) as PrismaClient
  }

  const newClient = new PrismaClient()

  prismaClients.set(defaultClientName, newClient)

  return newClient
}

// Add connection metadata to Redis for a vendor
async function addVendorToRedis(vendorId: string, dbUrl: string) {
  await redisCache.set(`vendor:${vendorId}:dbUrl`, dbUrl, 60 * 60 * 24); // Set with 24-hour expiry
}

async function shutdownDbs() {
  logger.info('Disconnecting from databases...');
  try {
    for (const client of prismaClients.values()) {
      try {
        await client.$disconnect();
      } catch (error) {
        logger.error('Error disconnecting Prisma client:', error);
      }
    }
  } catch (err) {
    logger.error('Error disconnecting Prisma clients:', err);
  }
}

export {
  getPrismaClient,
  addVendorToRedis,
  shutdownDbs,
  getDefaultPrismaClient,
};
