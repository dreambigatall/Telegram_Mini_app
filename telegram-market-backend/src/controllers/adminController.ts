import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { InviteService } from '../services/inviteService';
import { UserService } from '../services/userService';
import { ResponseHelper } from '../utils/response';
import mongoose from 'mongoose';

export const generateInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;

    // Only Super Admin can create other Admins
    if (role === UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
      const error = new Error('Only Super Admin can invite other Admins') as AppError;
      error.statusCode = 403;
      return next(error);
    }

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    const { invite, link } = await InviteService.generateInvite(
      req.user._id,
      role || UserRole.USER
    );

    return ResponseHelper.created(res, {
      inviteCode: invite.code,
      role: invite.roleToAssign,
      link
    }, 'Invite generated successfully');

  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as UserRole | undefined;
    const isBanned = req.query.isBanned !== undefined 
      ? req.query.isBanned === 'true' 
      : undefined;
    const search = req.query.search as string | undefined;

    const { users, total } = await UserService.getAllUsers(page, limit, {
      role,
      isBanned,
      search
    });

    return ResponseHelper.successWithPagination(res, users, total, page, limit, 'Users retrieved successfully');

  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { username, firstName, role, isBanned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid user ID') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    // Prevent self-downgrade from SUPER_ADMIN
    if (id === req.user._id.toString() && role && role !== UserRole.SUPER_ADMIN && req.user.role === UserRole.SUPER_ADMIN) {
      const error = new Error('Cannot downgrade your own SUPER_ADMIN role') as AppError;
      error.statusCode = 403;
      return next(error);
    }

    // Prevent self-banning (optional - remove if you want to allow it)
    if (id === req.user._id.toString() && isBanned === true) {
      const error = new Error('Cannot ban yourself') as AppError;
      error.statusCode = 403;
      return next(error);
    }

    const user = await UserService.updateUser(id, {
      username,
      firstName,
      role,
      isBanned
    });

    // Convert to plain object for JSON serialization
    const plainUser = user.toObject ? user.toObject() : user;

    return ResponseHelper.success(res, plainUser, 'User updated successfully');

  } catch (error) {
    if (error instanceof Error) {
      const appError = error as AppError;
      if (error.message === 'User not found') {
        appError.statusCode = 404;
      } else if (error.message === 'Cannot update a deleted user') {
        appError.statusCode = 400;
      }
      return next(appError);
    }
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid user ID') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    // Prevent self-deletion
    if (id === req.user._id.toString()) {
      const error = new Error('Cannot delete yourself') as AppError;
      error.statusCode = 403;
      return next(error);
    }

    const user = await UserService.deleteUser(id);

    // Convert to plain object for JSON serialization
    const plainUser = user.toObject ? user.toObject() : user;

    return ResponseHelper.success(res, plainUser, 'User deleted successfully');

  } catch (error) {
    if (error instanceof Error) {
      const appError = error as AppError;
      if (error.message === 'User not found') {
        appError.statusCode = 404;
      } else if (error.message === 'User already deleted') {
        appError.statusCode = 400;
      }
      return next(appError);
    }
    next(error);
  }
};
