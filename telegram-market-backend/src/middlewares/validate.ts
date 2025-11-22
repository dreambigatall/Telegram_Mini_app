import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Preprocess: convert empty strings to undefined for optional fields
      const processedBody = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [
          key,
          value === '' ? undefined : value
        ])
      );
      schema.parse(processedBody);
      // Update req.body with processed data
      req.body = { ...req.body, ...processedBody };
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
};

