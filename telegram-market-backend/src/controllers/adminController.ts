import { Request, Response } from 'express';
import crypto from 'crypto';
import Invite from '../models/Invite';
import { UserRole } from '../models/User';

// @desc    Generate a new invite link
// @route   POST /api/admin/invite
// @access  Private (Admin/SuperAdmin)
export const generateInvite = async (req: Request, res: Response) => {
  try {
    const { role } = req.body || {}; // 'ADMIN' or 'USER'

    // validation: Only Super Admin can create other Admins
    if (role === UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
       res.status(403).json({ message: 'Only Super Admin can invite other Admins' });
       return;
    }

    // 1. Generate a unique code (random 8-char hex string)
    const code = crypto.randomBytes(4).toString('hex');

    // 2. Save to DB
    const invite = await Invite.create({
      code,
      roleToAssign: role || UserRole.USER,
      createdBy: req.user?._id,
      isUsed: false
    });

    // 3. Create the Deep Link
    let botUsername = process.env.BOT_USERNAME || 'YourBotName'; 
    // Remove @ symbol if present (Telegram deep links don't use @)
    botUsername = botUsername.replace(/^@/, '');
    // Note: You should add BOT_USERNAME to your .env file for this to look nice
    
    const link = `https://t.me/${botUsername}?start=${code}`;

    res.status(201).json({
      success: true,
      inviteCode: code,
      role: invite.roleToAssign,
      link: link
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};