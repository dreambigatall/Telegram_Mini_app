import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

interface EnvConfig {
  MONGO_URI: string;
  BOT_TOKEN?: string; // Optional when ENABLE_MOCK_AUTH is true
  PORT: string;
  CORS_ORIGIN?: string;
  SUPER_ADMIN_ID?: string;
  STORAGE_CHAT_ID?: string; // Private channel ID for image storage (recommended)
  BOT_USERNAME?: string;
  NODE_ENV?: string;
  ENABLE_MOCK_AUTH?: string; // For Postman testing
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'MONGO_URI',
  'PORT'
];

export const validateEnv = (): void => {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // BOT_TOKEN is required unless mock auth is enabled
  if (process.env.ENABLE_MOCK_AUTH !== 'true' && !process.env.BOT_TOKEN) {
    logger.error('BOT_TOKEN is required when ENABLE_MOCK_AUTH is not enabled');
    throw new Error('BOT_TOKEN is required when ENABLE_MOCK_AUTH is not enabled');
  }

  // Validate format of some variables
  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    logger.warn('MONGO_URI does not start with "mongodb" - may be invalid');
  }

  if (process.env.PORT && isNaN(Number(process.env.PORT))) {
    throw new Error('PORT must be a valid number');
  }

  logger.info('Environment variables validated successfully');
};

