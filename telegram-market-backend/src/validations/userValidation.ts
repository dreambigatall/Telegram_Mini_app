import { z } from 'zod';
import { UserRole } from '../models/User';

export const updateUserSchema = z.object({
  username: z.string()
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .nullable(),
  firstName: z.string()
    .max(100, 'First name must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  role: z.nativeEnum(UserRole)
    .optional(),
  isBanned: z.boolean()
    .optional()
});

