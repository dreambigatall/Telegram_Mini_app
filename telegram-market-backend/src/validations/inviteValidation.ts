import { z } from 'zod';
import { UserRole } from '../models/User';

export const generateInviteSchema = z.object({
  role: z.nativeEnum(UserRole)
    .refine(
      (role) => role === UserRole.USER || role === UserRole.ADMIN || role === UserRole.SELLER || role === UserRole.BUYER,
      { message: 'Role must be USER, ADMIN, SELLER, or BUYER' }
    )
});

