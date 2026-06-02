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

const app = express();

// ✅ IMPORTANT: no fs, no server.listen

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure DB connection per request (caches connection)
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (error) {
    // Log and pass error to error handler
    console.error("Database connection error on request:", error);
    next(error);
  }
});

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Errors
app.use(notFoundHandler);
app.use(errorHandler);

// ✅ THIS is what Vercel uses
export default app;