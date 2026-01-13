import crypto from 'crypto';
import Invite, { IInvite } from '../models/Invite';
import { UserRole } from '../models/User';
import { Types } from 'mongoose';
import logger from '../utils/logger';

export class InviteService {
  static async generateInvite(
    createdBy: Types.ObjectId,
    role: UserRole = UserRole.USER
  ): Promise<{ invite: IInvite; link: string }> {
    // Generate a unique code
    const code = crypto.randomBytes(4).toString('hex');

    // Save to DB
    const invite = await Invite.create({
      code,
      roleToAssign: role,
      createdBy,
      isUsed: false
    });

    // Create the Deep Link
    let botUsername = process.env.BOT_USERNAME || 'YourBotName';
    botUsername = botUsername.replace(/^@/, '');
    
    const link = `https://t.me/${botUsername}?start=${code}`;

    logger.info('Invite generated', {
      inviteId: invite._id,
      code: invite.code,
      role: invite.roleToAssign,
      createdBy
    });

    return { invite, link };
  }

  static async findUnusedInvite(code: string) {
    return Invite.findOne({ code, isUsed: false });
  }
}

