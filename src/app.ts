import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import contactRoutes from "./router/contactRoutes";
import newsletterRoutes from "./router/newsletterRoutes";
import authRoutes from "./router/authRoutes";
import { ensureDB } from "./lib/db";
import { logger } from "./utils/logger";

const app = express();

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

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;