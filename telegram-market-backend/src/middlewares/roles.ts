import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

// Allow specific roles
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
      return;
    }
    next();
  };
};