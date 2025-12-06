import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import bot from '../bot';
import { AppError } from '../middlewares/errorHandler';
import mongoose from 'mongoose';
import { ProductService } from '../services/productService';
import { NotificationService } from '../services/notificationService';
import { ResponseHelper } from '../utils/response';

export const submitProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, originalPrice, mediaFileId, madeIn, expirationDate, expirationDateRaw } = req.body;

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    const product = await ProductService.createProduct({
      seller: req.user._id,
      title,
      description,
      originalPrice,
      mediaFileId,
      madeIn,
      expirationDate,
      expirationDateRaw: expirationDateRaw || null
    });

    // Notify Admin
    const sellerName = req.user?.username || req.user?.firstName || 'Unknown User';
    await NotificationService.notifyAdminNewProduct({
      sellerName,
      title,
      price: originalPrice,
      mediaFileId
    });

    return ResponseHelper.created(res, product, 'Item submitted for review');

  } catch (error) {
    next(error);
  }
};

export const getPendingProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { products, total } = await ProductService.getPendingProducts(page, limit);

    // Convert to plain objects for JSON serialization
    const plainProducts = products.map(p => 
      p.toObject ? p.toObject() : p
    );

    // Return array directly for backward compatibility with frontend
    res.status(200).json(plainProducts);
  } catch (error) {
    next(error);
  }
};

export const approveProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { finalPrice, adminUsername, adminPhone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid product ID') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    const product = await ProductService.approveProduct(id, {
      finalPrice,
      adminUsername: adminUsername || req.user?.username || process.env.BOT_USERNAME || 'Admin',
      adminPhone,
      approvedBy: req.user._id
    });

    // Notify Seller
    const seller = product.seller as any;
    if (seller && seller.telegramId) {
      await NotificationService.notifySellerProductApproved(
        seller.telegramId,
        product.title
      );
    }

    return ResponseHelper.success(res, product, 'Product Published');

  } catch (error) {
    if (error instanceof Error) {
      const appError = error as AppError;
      if (error.message === 'Product not found') {
        appError.statusCode = 404;
      } else if (error.message === 'Product is not pending review') {
        appError.statusCode = 400;
      }
      return next(appError);
    }
    next(error);
  }
};

export const rejectProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid product ID') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    const product = await ProductService.rejectProduct(id, reason);

    // Notify Seller
    const seller = product.seller as any;
    if (seller && seller.telegramId) {
      await NotificationService.notifySellerProductRejected(
        seller.telegramId,
        product.title,
        reason
      );
    }

    return ResponseHelper.success(res, null, 'Product Rejected');

  } catch (error) {
    if (error instanceof Error) {
      const appError = error as AppError;
      if (error.message === 'Product not found') {
        appError.statusCode = 404;
      }
      return next(appError);
    }
    next(error);
  }
};

export const getPublicFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { products, total } = await ProductService.getPublishedProducts(page, limit);

    return ResponseHelper.successWithPagination(res, products, total, page, limit);

  } catch (error) {
    next(error);
  }
};

export const getProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;

    if (!fileId || fileId.trim().length === 0) {
      const error = new Error('File ID is required') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    const fileLink = await bot.telegram.getFileLink(fileId);

    const response = await axios({
      url: fileLink.href,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(res);

  } catch (error) {
    const appError = new Error('Image not found') as AppError;
    appError.statusCode = 404;
    next(appError);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, finalPrice, adminContact, status, madeIn, expirationDate, expirationDateRaw, availableTimeValue, availableTimeUnit } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid product ID') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    // Build update object - only include fields that are explicitly provided
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;
    if (adminContact !== undefined) updateData.adminContact = adminContact;
    if (status !== undefined) updateData.status = status;
    if (madeIn !== undefined) updateData.madeIn = madeIn;
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate;
    if (expirationDateRaw !== undefined) updateData.expirationDateRaw = expirationDateRaw;
    if (availableTimeValue !== undefined) updateData.availableTimeValue = availableTimeValue;
    if (availableTimeUnit !== undefined) updateData.availableTimeUnit = availableTimeUnit;

    const product = await ProductService.updateProduct(id, updateData);

    // Convert to plain object for JSON serialization
    const plainProduct = product.toObject ? product.toObject() : product;

    return ResponseHelper.success(res, plainProduct, 'Product updated successfully');

  } catch (error) {
    if (error instanceof Error) {
      const appError = error as AppError;
      if (error.message === 'Product not found') {
        appError.statusCode = 404;
      } else if (error.message === 'Cannot update a deleted product') {
        appError.statusCode = 400;
      }
      return next(appError);
    }
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid product ID') as AppError;
      error.statusCode = 400;
      return next(error);
    }

    if (!req.user?._id) {
      const error = new Error('User not authenticated') as AppError;
      error.statusCode = 401;
      return next(error);
    }

    const product = await ProductService.deleteProduct(id);

    // Convert to plain object for JSON serialization
    const plainProduct = product.toObject ? product.toObject() : product;

    // Optionally notify seller about deletion
    const seller = product.seller as any;
    if (seller && seller.telegramId) {
      await NotificationService.notifySellerProductRejected(
        seller.telegramId,
        product.title,
        'Your product has been deleted by an admin.'
      );
    }

    return ResponseHelper.success(res, plainProduct, 'Product deleted successfully');

  } catch (error) {
    if (error instanceof Error) {
      const appError = error as AppError;
      if (error.message === 'Product not found') {
        appError.statusCode = 404;
      }
      return next(appError);
    }
    next(error);
  }
};