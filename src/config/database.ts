import { PrismaClient } from '@prisma/client';
import { config } from './env';
import { logger } from '../utils/logger';

// Create a single Prisma Client instance with explicit configuration
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

export const connectDatabase = async (): Promise<void> => {
  const databaseUrl = config.database.url;

  if (!databaseUrl) {
    logger.error('DATABASE_URL is not defined in environment variables');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected successfully');
  } catch (error) {
    logger.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
};
