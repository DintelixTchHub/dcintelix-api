// 1️⃣ Load dotenv immediately
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";

// Export for Vercel serverless
export default app;

// Local development mode
if (process.env.NODE_ENV !== 'production') {
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`🚀 Server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
}
