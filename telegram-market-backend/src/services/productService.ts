import Product, { ProductStatus, IProduct } from '../models/Product';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import { cacheService, CacheKeys } from '../utils/cache';

export interface CreateProductData {
  seller: Types.ObjectId;
  title: string;
  description?: string;
  originalPrice: number;
  mediaFileId?: string;
}

export interface ApproveProductData {
  finalPrice?: number;
  adminUsername?: string;
  adminPhone?: string;
  approvedBy: Types.ObjectId;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  finalPrice?: number;
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: ProductStatus;
}

export class ProductService {
  static async createProduct(data: CreateProductData): Promise<IProduct> {
    const product = await Product.create({
      seller: data.seller,
      title: data.title,
      description: data.description,
      originalPrice: data.originalPrice,
      mediaFileId: data.mediaFileId,
      status: ProductStatus.PENDING
    });

    // Clear pending products cache
    cacheService.clearPattern('products:pending:');

    logger.info('Product created', {
      productId: product._id,
      title: product.title,
      sellerId: data.seller
    });

    return product;
  }

  static async getPendingProducts(page: number = 1, limit: number = 20) {
    const cacheKey = CacheKeys.pendingProducts(page, limit);
    
    // Try cache first
    const cached = cacheService.get<{ products: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ status: ProductStatus.PENDING })
        .populate('seller', 'username firstName telegramId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ status: ProductStatus.PENDING })
    ]);

    // Convert to plain objects for caching and response
    const result = { 
      products: products.map(p => p.toObject ? p.toObject() : p), 
      total 
    };
    
    // Cache for 2 minutes (pending products change frequently)
    cacheService.set(cacheKey, result, 120);
    
    return result;
  }

  static async getPublishedProducts(page: number = 1, limit: number = 20) {
    const cacheKey = CacheKeys.productFeed(page, limit);
    
    // Try cache first
    const cached = cacheService.get<{ products: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ status: ProductStatus.PUBLISHED })
        .lean() // Safe to use lean here (no populate)
        .sort({ updatedAt: -1 })
        .select('-originalPrice -approvedBy -__v -seller')
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ status: ProductStatus.PUBLISHED })
    ]);

    // Products are already plain objects from lean(), just ensure _id is string
    const result = { 
      products: products.map((p: any) => ({
        ...p,
        _id: p._id ? p._id.toString() : p._id
      })), 
      total 
    };
    
    // Cache for 5 minutes (published products change less frequently)
    cacheService.set(cacheKey, result, 300);
    
    return result;
  }

  static async findById(id: string | Types.ObjectId) {
    return Product.findById(id).populate('seller');
  }

  static async approveProduct(
    productId: string | Types.ObjectId,
    data: ApproveProductData
  ): Promise<IProduct> {
    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.status !== ProductStatus.PENDING) {
      throw new Error('Product is not pending review');
    }

    product.status = ProductStatus.PUBLISHED;
    product.approvedBy = data.approvedBy;
    product.finalPrice = data.finalPrice || product.originalPrice;
    product.adminContact = {
      username: data.adminUsername || 'Admin',
      phoneNumber: data.adminPhone || ''
    };

    await product.save();

    // Clear caches
    cacheService.clearProductCache();
    cacheService.del(CacheKeys.product(productId.toString()));

    logger.info('Product approved', {
      productId: product._id,
      title: product.title,
      approvedBy: data.approvedBy,
      finalPrice: product.finalPrice
    });

    return product;
  }

  static async rejectProduct(
    productId: string | Types.ObjectId,
    reason?: string
  ): Promise<IProduct> {
    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      throw new Error('Product not found');
    }

    product.status = ProductStatus.REJECTED;
    await product.save();

    // Clear caches
    cacheService.clearPattern('products:pending:');
    cacheService.del(CacheKeys.product(productId.toString()));

    logger.info('Product rejected', {
      productId: product._id,
      title: product.title,
      reason: reason || 'Not specified'
    });

    return product;
  }

  static async updateProduct(
    productId: string | Types.ObjectId,
    data: UpdateProductData
  ): Promise<IProduct> {
    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      throw new Error('Product not found');
    }

    // Only allow updating published products (or allow all statuses except DELETED)
    if (product.status === ProductStatus.DELETED) {
      throw new Error('Cannot update a deleted product');
    }

    // Update fields if provided
    if (data.title !== undefined) {
      product.title = data.title;
    }
    if (data.description !== undefined) {
      product.description = data.description;
    }
    if (data.finalPrice !== undefined) {
      product.finalPrice = data.finalPrice;
    }
    if (data.adminContact !== undefined) {
      product.adminContact = {
        username: data.adminContact.username ?? product.adminContact?.username ?? 'Admin',
        phoneNumber: data.adminContact.phoneNumber ?? product.adminContact?.phoneNumber ?? ''
      };
    }
    if (data.status !== undefined) {
      product.status = data.status;
    }

    await product.save();

    // Clear all product caches
    cacheService.clearProductCache();
    cacheService.del(CacheKeys.product(productId.toString()));

    logger.info('Product updated', {
      productId: product._id,
      title: product.title,
      updates: Object.keys(data)
    });

    return product;
  }

  static async deleteProduct(
    productId: string | Types.ObjectId
  ): Promise<IProduct> {
    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      throw new Error('Product not found');
    }

    // Soft delete: set status to DELETED
    const previousStatus = product.status;
    product.status = ProductStatus.DELETED;
    await product.save();

    // Clear all product caches
    cacheService.clearProductCache();
    cacheService.del(CacheKeys.product(productId.toString()));

    logger.info('Product deleted (soft delete)', {
      productId: product._id,
      title: product.title,
      previousStatus
    });

    return product;
  }
}

