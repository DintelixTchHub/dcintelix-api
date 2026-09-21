import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { ensureDB } from "./lib/db";
import { logger } from "./utils/logger";
import mainRouter from "./router";

const app = express();

// Log every incoming request before route and database handling.
app.use((req, _res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware - CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Middleware - Parser
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware - Ensure DB connection on request
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (error) {
    logger.error("Database connection error on request:", error);
    next(error);
  }
});

const apiPrefix = process.env.API_PREFIX;

// Routes
app.use(`${apiPrefix}/`, mainRouter);


// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;