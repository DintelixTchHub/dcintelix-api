// 1️⃣ Load dotenv immediately
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { testDatabaseConnection } from "./lib/db";

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Test database connection before starting server
    await testDatabaseConnection();
    
    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server - database connection error");
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
