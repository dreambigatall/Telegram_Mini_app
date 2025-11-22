import { Request, Response, NextFunction } from 'express';
import { validateTelegramData } from '../utils/validateTelegramData';
import User from '../models/User';
import { AppError } from './errorHandler';
import { cacheService, CacheKeys } from '../utils/cache';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
        // Need to update - fetch fresh from DB
        user = await User.findOne({ telegramId });
        if (user) {
          user.username = telegramUser.username || '';
          user.firstName = telegramUser.first_name || '';
          await user.save();
          cacheService.set(cacheKey, user.toObject(), 120);
        }
      } else {
        // Use cached user (convert to Mongoose-like object for req.user)
        user = cachedUser;
      }
    } else {
      // Cache miss - query database
      user = await User.findOne({ telegramId });
      
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

