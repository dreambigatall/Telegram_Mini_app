import { z } from 'zod';
import { UserRole } from '../models/User';

export const generateInviteSchema = z.object({
  role: z.nativeEnum(UserRole)
    .refine(
      (role) => role === UserRole.USER || role === UserRole.ADMIN,
      { message: 'Role must be either USER or ADMIN' }
    )
});

