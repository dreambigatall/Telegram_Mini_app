import { Request, Response, NextFunction } from 'express';
import formidable from 'formidable';
import { AppError } from './errorHandler';
import logger from '../utils/logger';

// Extend Express Request to include files
declare global {
  namespace Express {
    interface Request {
      files?: formidable.File[];
      fields?: formidable.Fields;
    }
  }
}

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Max file size: 10MB per image
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Max number of images: 4
const MAX_IMAGES = 4;

/**
 * Middleware to parse multipart/form-data and validate image uploads
 * Supports up to 4 images per request
 */
export const parseMultipartForm = (req: Request, res: Response, next: NextFunction) => {
  // Only process if content-type is multipart/form-data
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    // Not a multipart request, skip this middleware
    return next();
  }

  const form = formidable({
    maxFiles: MAX_IMAGES,
    maxFileSize: MAX_FILE_SIZE,
    keepExtensions: true,
    allowEmptyFiles: false,
    multiples: true // Allow multiple files with same field name
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      logger.error('Formidable parse error', { error: err });
      const error = new Error('Failed to parse form data') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    // Convert files object to array
    // Formidable returns files as object with field names as keys
    const fileArray: formidable.File[] = [];
    
    // Handle both single file and multiple files
    Object.values(files).forEach((fileOrArray) => {
      if (!fileOrArray) {
        // Skip undefined/null values
        return;
      }
      if (Array.isArray(fileOrArray)) {
        fileArray.push(...fileOrArray);
      } else {
        fileArray.push(fileOrArray);
      }
    });

    // Validate number of files
    if (fileArray.length > MAX_IMAGES) {
      const error = new Error(`Maximum ${MAX_IMAGES} images allowed`) as AppError;
      error.statusCode = 400;
      return next(error);
    }

    // Validate each file
    for (const file of fileArray) {
      // Check MIME type
      if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        const error = new Error(
          `Invalid file type: ${file.mimetype}. Allowed types: jpeg, jpg, png, webp, gif`
        ) as AppError;
        error.statusCode = 400;
        return next(error);
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const error = new Error(
          `File ${file.originalFilename || 'unknown'} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        ) as AppError;
        error.statusCode = 400;
        return next(error);
      }
    }

    // Attach files and fields to request
    req.files = fileArray;
    req.fields = fields;

    // Convert fields to req.body for validation middleware
    // Formidable returns fields as arrays, convert to single values
    const body: Record<string, any> = {};
    
    // Fields that should be converted to numbers
    const numericFields = ['originalPrice', 'finalPrice', 'availableTimeValue'];
    
    Object.entries(fields).forEach(([key, value]) => {
      let fieldValue: any;
      
      if (Array.isArray(value) && value.length > 0) {
        // Take first value if array
        fieldValue = value[0];
      } else if (value) {
        fieldValue = value;
      } else {
        return; // Skip undefined/null values
      }
      
      // Convert numeric fields from string to number
      if (numericFields.includes(key) && typeof fieldValue === 'string') {
        const numValue = parseFloat(fieldValue);
        if (!isNaN(numValue)) {
          body[key] = numValue;
        } else {
          body[key] = fieldValue; // Keep original if conversion fails (validation will catch it)
        }
      } else {
        body[key] = fieldValue;
      }
    });

    // Merge with existing body (if any)
    req.body = { ...req.body, ...body };

    logger.debug('Multipart form parsed', {
      fileCount: fileArray.length,
      fields: Object.keys(fields)
    });

    next();
  });
};

