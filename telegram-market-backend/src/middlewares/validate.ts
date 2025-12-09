import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Store original expirationDate value before validation transforms it
      const originalExpirationDate = req.body.expirationDate;
      const isExpirationDateString = typeof originalExpirationDate === 'string' && originalExpirationDate.trim() !== '';
      
      // Preprocess: convert empty strings to undefined for optional fields
      const processedBody = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [
          key,
          value === '' ? undefined : value
        ])
      );
      
      // If expirationDateRaw is not provided but expirationDate is a string, set it
      if (isExpirationDateString && !processedBody.expirationDateRaw) {
        processedBody.expirationDateRaw = originalExpirationDate.trim();
      }
      
      const validated = schema.parse(processedBody) as Record<string, any>;
      // Update req.body with validated data (which includes parsed expirationDate and expirationDateRaw)
      req.body = { ...req.body, ...validated };
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
};

