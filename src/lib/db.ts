import { prisma } from "../config/database";
import { logger } from "../utils/logger";


export const ensureDB = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("✅ Database reachable");
  } catch (err) {
    logger.error("❌ DB check failed:", err);
    throw err;
  }
};


export const testDatabaseConnection = async () => {
  if (process.env.NODE_ENV !== "development") return;

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("✅ Database connection successful (startup test)");
  } catch (error) {
    logger.error("❌ DATABASE CONNECTION FAILED ON STARTUP", error);
    logger.error("Check your DATABASE_URL in .env file");
    throw error;
  }
};