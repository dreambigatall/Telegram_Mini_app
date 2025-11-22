import { z } from 'zod';

export const submitProductSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  originalPrice: z.number()
    .positive('Price must be a positive number')
    .max(10000000, 'Price is too high'),
  mediaFileId: z.string()
    .optional()
    .nullable()
});

export const approveProductSchema = z.object({
  finalPrice: z.number()
    .positive('Price must be a positive number')
    .max(10000000, 'Price is too high')
    .optional()
    .nullable(),
  adminUsername: z.string()
    .max(100, 'Username too long')
    .trim()
    .optional()
    .nullable(),
  adminPhone: z.string()
    .max(20, 'Phone number too long')
    .optional()
    .nullable()
}).passthrough();

export const rejectProductSchema = z.object({
  reason: z.string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .nullable()
    .transform(val => val || 'Does not meet guidelines.')
});

