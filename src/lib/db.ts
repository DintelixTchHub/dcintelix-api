import { prisma } from "../config/database";
import { logger } from "../utils/logger";

let isConnected = false;

export const ensureDB = async () => {
  if (isConnected) return; // Already connected
  
  try {
    await prisma.$connect();
    isConnected = true;
    logger.info("✅ Database connected");
  } catch (err) {
    logger.error("❌ DB connection failed:", err);
    isConnected = false;
    throw err;
  }
};

// Test connection on startup
export const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info("✅ Database connection successful on startup");
    isConnected = true;
  } catch (error) {
    logger.error("❌ DATABASE CONNECTION FAILED ON STARTUP", error);
    logger.error("Check your DATABASE_URL in .env file");
    throw error;
  }
};