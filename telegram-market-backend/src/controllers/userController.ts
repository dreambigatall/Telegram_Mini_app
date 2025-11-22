import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { ResponseHelper } from '../utils/response';

/**
 * Get current authenticated user
 * GET /api/users/me
 * Protected route - requires valid Telegram initData
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User is already attached by protect middleware
    if (!req.user) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    // Convert Mongoose document to plain object (handles both document and cached object)
    const userObject = (req.user as any).toObject ? (req.user as any).toObject() : req.user;
    
    // Format response with required fields
    const userData = {
      _id: userObject._id?.toString() || userObject._id,
      telegramId: userObject.telegramId,
      username: userObject.username,
      firstName: userObject.firstName,
      role: userObject.role,
      isBanned: userObject.isBanned,
      createdAt: userObject.createdAt
    };

    return ResponseHelper.success(res, userData, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

