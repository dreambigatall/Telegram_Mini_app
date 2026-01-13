import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AppError } from './errorHandler';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role as UserRole)) {
      const error = new Error(
        `User role ${req.user.role} is not authorized to access this route`
      ) as AppError;
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};