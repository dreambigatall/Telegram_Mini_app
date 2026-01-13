import { Request, Response, NextFunction } from 'express';
import { validateTelegramData } from '../utils/validateTelegramData';
import User from '../models/User';
import { AppError } from './errorHandler';
import { cacheService, CacheKeys } from '../utils/cache';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // MOCK AUTHENTICATION FOR POSTMAN TESTING
    // Set ENABLE_MOCK_AUTH=true in .env to enable
    if (process.env.ENABLE_MOCK_AUTH === 'true') {
      const mockTelegramId = req.headers['x-mock-telegram-id'] as string || '123456789';
      const mockRole = (req.headers['x-mock-role'] as string || 'USER').toUpperCase();
      
      // Find or create mock user
      let user = await User.findOne({ telegramId: mockTelegramId, isDeleted: { $ne: true } });
      
      if (!user) {
        // Create mock user if doesn't exist
        user = await User.create({
          telegramId: mockTelegramId,
          username: 'postman_test_user',
          firstName: 'Postman Test',
          role: mockRole as any,
          isBanned: false,
          isDeleted: false
        });
      } else {
        // Update role if header is provided
        if (mockRole && ['USER', 'ADMIN', 'SUPER_ADMIN', 'SELLER', 'BUYER'].includes(mockRole)) {
          user.role = mockRole as any;
          await user.save();
        }
      }

      if (user.isBanned) {
        const error = new Error('You are banned.') as AppError;
        error.statusCode = 403;
        return next(error);
      }

      req.user = user;
      return next();
    }

    // NORMAL TELEGRAM AUTHENTICATION
    const initData = req.headers.authorization;

    if (!initData) {
      const error = new Error('Not authorized, no token') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    const telegramUser = validateTelegramData(initData);

    if (!telegramUser) {
      const error = new Error('Invalid Telegram Data') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    const telegramId = telegramUser.id.toString();
    const cacheKey = CacheKeys.user(telegramId);
    
    // Try cache first
    const cachedUser = cacheService.get<any>(cacheKey);
    let user;
    
    if (cachedUser) {
      // Cache hit - check if update needed
      if (cachedUser.username !== telegramUser.username || cachedUser.firstName !== telegramUser.first_name) {
        // Need to update - fetch fresh from DB (exclude deleted users)
        // Use $ne: true to match both false and undefined (for existing users without the field)
        user = await User.findOne({ telegramId, isDeleted: { $ne: true } });
        if (user) {
          user.username = telegramUser.username || '';
          user.firstName = telegramUser.first_name || '';
          await user.save();
          cacheService.set(cacheKey, user.toObject(), 120);
        } else {
          // User was deleted, clear cache and deny access
          cacheService.del(cacheKey);
          const error = new Error('Access Denied. You need an invite.') as AppError;
          error.statusCode = 403;
          return next(error);
        }
      } else {
        // Use cached user (convert to Mongoose-like object for req.user)
        // Check if cached user is deleted (only deny if explicitly true)
        if (cachedUser.isDeleted === true) {
          cacheService.del(cacheKey);
          const error = new Error('Access Denied. You need an invite.') as AppError;
          error.statusCode = 403;
          return next(error);
        }
        user = cachedUser;
      }
    } else {
      // Cache miss - query database (exclude deleted users)
      // Use $ne: true to match both false and undefined (for existing users without the field)
      user = await User.findOne({ telegramId, isDeleted: { $ne: true } });
      
      if (!user) {
        const error = new Error('Access Denied. You need an invite.') as AppError;
        error.statusCode = 403;
        return next(error);
      }
      
      // Sync if needed
      if (user.username !== telegramUser.username || user.firstName !== telegramUser.first_name) {
        user.username = telegramUser.username || '';
        user.firstName = telegramUser.first_name || '';
        await user.save();
      }
      
      // Cache for 2 minutes
      cacheService.set(cacheKey, user.toObject(), 120);
    }

    if (user.isBanned) {
      const error = new Error('You are banned.') as AppError;
      error.statusCode = 403;
      return next(error);
    }

    req.user = user;
    next();

  } catch (error) {
    next(error);
  }
};

