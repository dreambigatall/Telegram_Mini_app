/// <reference path="./types/express.d.ts" />
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import bot from './bot';
import adminRoutes from './routes/adminRoutes';
import productRoutes from './routes/productRoutes';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/healthRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { requestLogger } from './middlewares/requestLogger';
import logger from './utils/logger';
import { validateEnv } from './config/validateEnv';
import mongoose from 'mongoose';
import { cacheService } from './utils/cache';

// Load Config
dotenv.config();

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  logger.error('Environment validation failed', { error });
  process.exit(1);
}

// Connect to Database
connectDB();

const app = express();

// Trust proxy (needed for rate limiting behind proxies/load balancers)
// Only trust first proxy (more secure than trusting all)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

// Request logging (only in development or if LOG_LEVEL is debug)
if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
  app.use(requestLogger);
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip trust proxy validation for development (behind Cloudflare tunnel)
  validate: {
    trustProxy: false
  }
  // Using default keyGenerator which properly handles IPv6
});

app.use('/api/', limiter);

// Health Check Routes (before rate limiting)
app.use('/health', healthRoutes);

// Basic root route
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'Active', message: 'Telegram Market Backend is Running' });
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use(notFound);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start the Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  
  bot.launch().then(() => {
    logger.info('🤖 Telegram Bot started');
  }).catch((err) => {
    logger.error('Bot launch failed', { error: err });
    process.exit(1);
  });
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close database connections
    await mongoose.connection.close();
    logger.info('Database connection closed');

    // Stop Telegram bot
    await bot.stop();
    logger.info('Telegram bot stopped');

    // Clear cache
    cacheService.clearPattern('');
    logger.info('Cache cleared');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Don't exit, just log (in production, you might want to exit)
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  gracefulShutdown('uncaughtException');
});