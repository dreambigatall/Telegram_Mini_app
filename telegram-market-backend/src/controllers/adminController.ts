import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AppError } from '../middlewares/errorHandler';
import { InviteService } from '../services/inviteService';
import { ResponseHelper } from '../utils/response';

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
