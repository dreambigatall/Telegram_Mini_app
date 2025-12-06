import { z } from 'zod';
import { ProductStatus, AvailableTimeUnit } from '../models/Product';

/**
 * Parses various date formats to a Date object
 * Supports:
 * - Year only: "2026" -> end of year (2026-12-31)
 * - Year/Month: "2026/01" or "2026-01" -> end of month (2026-01-31)
 * - Full date: "2026/01/15" or "2026-01-15" -> exact date
 * - ISO dates: "2026-01-15T00:00:00Z" -> exact date
 */
const parseFlexibleDate = (input: unknown): Date | null => {
  if (input === null || input === undefined) {
    return null;
  }

  if (input instanceof Date) {
    return input;
  }

  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Handle year-only format: "2026" -> end of year
  if (/^\d{4}$/.test(trimmed)) {
    const year = parseInt(trimmed, 10);
    if (year >= 1000 && year <= 9999) {
      // Year only: set to end of year (December 31) in UTC
      return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    }
  }

  // Month name mapping (case-insensitive)
  const monthNames: Record<string, number> = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };

  // Handle year/month formats with month names: "Nov/2026" or "November/2026" or "2026/Nov"
  const yearMonthNameMatch1 = trimmed.match(/^([A-Za-z]+)[\/\-](\d{4})$/i); // "Nov/2026"
  const yearMonthNameMatch2 = trimmed.match(/^(\d{4})[\/\-]([A-Za-z]+)$/i); // "2026/Nov"
  
  if (yearMonthNameMatch1) {
    const monthName = yearMonthNameMatch1[1].toLowerCase();
    const year = parseInt(yearMonthNameMatch1[2], 10);
    const month = monthNames[monthName];
    
    if (month && year >= 1000 && year <= 9999) {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
    }
  }
  
  if (yearMonthNameMatch2) {
    const year = parseInt(yearMonthNameMatch2[1], 10);
    const monthName = yearMonthNameMatch2[2].toLowerCase();
    const month = monthNames[monthName];
    
    if (month && year >= 1000 && year <= 9999) {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
    }
  }

  // Handle year/month formats: "2026/01" or "2026-01" or "2026/2" -> end of month
  const yearMonthMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1], 10);
    const monthStr = yearMonthMatch[2];
    const month = parseInt(monthStr, 10); // 1-12 (not 0-indexed yet)
    
    if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12) {
      // Get last day of the month using UTC
      // month - 1 because Date.UTC uses 0-indexed months (0-11)
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); // Day 0 of next month = last day of current month
      // Set to end of that month in UTC
      return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
    }
  }

  // Handle year/month/day formats: "2026/01/15" or "2026-01-15"
  const fullDateMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (fullDateMatch) {
    const year = parseInt(fullDateMatch[1], 10);
    const month = parseInt(fullDateMatch[2], 10); // 1-12
    const day = parseInt(fullDateMatch[3], 10);
    if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Use UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      // Verify the date is valid
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
        return date;
      }
    }
  }

  // Try to parse as ISO date or other standard formats
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return null;
};

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
    .nullable(),
  madeIn: z.string()
    .max(100, 'Made in location must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  expirationDate: z
    .preprocess((val) => {
      // If null/undefined, return null (valid)
      if (val === null || val === undefined) {
        return null;
      }
      // If already a Date, return it
      if (val instanceof Date) {
        return val;
      }
      // Try to parse the date
      const parsed = parseFlexibleDate(val);
      if (parsed === null && val !== null && val !== undefined) {
        // Invalid date format - throw error
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          message: 'Invalid date format. Use: YYYY, YYYY/MM, YYYY/MM/DD, or ISO date format',
          path: []
        }]);
      }
      return parsed;
    }, z.date().nullable())
    .refine((val) => {
      if (val === null) return true;
      return val > new Date();
    }, {
      message: 'Expiration date must be in the future'
    })
    .optional()
    .nullable(),
  expirationDateRaw: z.string()
    .trim()
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

export const updateProductSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  finalPrice: z.number()
    .positive('Price must be a positive number')
    .max(10000000, 'Price is too high')
    .optional()
    .nullable(),
  adminContact: z.object({
    username: z.string()
      .max(100, 'Username too long')
      .trim()
      .optional()
      .nullable(),
    phoneNumber: z.string()
      .max(20, 'Phone number too long')
      .optional()
      .nullable()
  }).optional(),
  status: z.nativeEnum(ProductStatus)
    .optional(),
  madeIn: z.string()
    .max(100, 'Made in location must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  expirationDate: z
    .preprocess((val) => {
      // If null/undefined, return null (valid)
      if (val === null || val === undefined) {
        return null;
      }
      // If already a Date, return it
      if (val instanceof Date) {
        return val;
      }
      // Try to parse the date
      const parsed = parseFlexibleDate(val);
      if (parsed === null && val !== null && val !== undefined) {
        // Invalid date format - throw error
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          message: 'Invalid date format. Use: YYYY, YYYY/MM, YYYY/MM/DD, or ISO date format',
          path: []
        }]);
      }
      return parsed;
    }, z.date().nullable())
    .refine((val) => {
      if (val === null) return true;
      return val > new Date();
    }, {
      message: 'Expiration date must be in the future'
    })
    .optional()
    .nullable(),
  expirationDateRaw: z.string()
    .trim()
    .optional()
    .nullable(),
  availableTimeValue: z.number()
    .positive('Available time value must be a positive number')
    .int('Available time value must be an integer')
    .max(1000, 'Available time value is too high')
    .optional()
    .nullable(),
  availableTimeUnit: z.nativeEnum(AvailableTimeUnit, {
    message: 'Available time unit must be: hour, day, weeks, or month'
  })
    .optional()
    .nullable()
}).transform((data) => {
  // If only availableTimeValue is provided without availableTimeUnit, default to "day"
  if (data.availableTimeValue !== null && data.availableTimeValue !== undefined) {
    if (!data.availableTimeUnit || data.availableTimeUnit === null) {
      data.availableTimeUnit = AvailableTimeUnit.DAY;
    }
  }
  // If availableTimeValue is null/undefined but availableTimeUnit is provided, set unit to null
  if ((data.availableTimeValue === null || data.availableTimeValue === undefined) && 
      data.availableTimeUnit !== null && data.availableTimeUnit !== undefined) {
    data.availableTimeUnit = null;
  }
  return data;
});

