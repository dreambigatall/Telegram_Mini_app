import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request (only in debug mode to avoid spam)
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
  }

  // Use 'finish' event instead of overriding res.end (safer)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests (>500ms)
    if (duration > 500) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }

    // Log response in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

