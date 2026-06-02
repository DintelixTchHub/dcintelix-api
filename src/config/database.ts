import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton Prisma Client - lazy connect
let prismaInstance: PrismaClient | null = null;

export const getPrismaInstance = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      // Use environment DATABASE_URL directly
      // Prisma handles connection pooling automatically
    });

    // Handle disconnection on process exit
    process.on('SIGTERM', async () => {
      await prismaInstance?.$disconnect();
    });

    process.on('SIGINT', async () => {
      await prismaInstance?.$disconnect();
    });
  }

  return prismaInstance;
};

export const prisma = getPrismaInstance();

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info('Database disconnected');
  }
};
