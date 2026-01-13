import User, { IUser, UserRole } from '../models/User';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import { cacheService, CacheKeys } from '../utils/cache';

export interface UpdateUserData {
  username?: string;
  firstName?: string;
  role?: UserRole;
  isBanned?: boolean;
}

export interface GetAllUsersFilters {
  role?: UserRole;
  isBanned?: boolean;
  search?: string;
}

export class UserService {
  static async getAllUsers(
    page: number = 1,
    limit: number = 20,
    filters: GetAllUsersFilters = {}
  ) {
    const cacheKey = `users:list:${page}:${limit}:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = cacheService.get<{ users: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;
    
    // Build query
    // Use $ne: true to match both false and undefined (for existing users without the field)
    const query: any = { 
      isDeleted: { $ne: true } 
    };

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.isBanned !== undefined) {
      query.isBanned = filters.isBanned;
    }

    if (filters.search) {
      query.$or = [
        { username: { $regex: filters.search, $options: 'i' } },
        { firstName: { $regex: filters.search, $options: 'i' } },
        { telegramId: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .lean() // Use lean for better performance
        .sort({ createdAt: -1 })
        .select('-__v')
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    // Convert _id to string for JSON serialization
    const result = {
      users: users.map((u: any) => ({
        ...u,
        _id: u._id ? u._id.toString() : u._id
      })),
      total
    };

    // Cache for 1 minute (user list changes frequently)
    cacheService.set(cacheKey, result, 60);

    return result;
  }

  static async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    // Use $ne: true to match both false and undefined (for existing users without the field)
    return User.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    });
  }

  static async updateUser(
    userId: string | Types.ObjectId,
    data: UpdateUserData
  ): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isDeleted) {
      throw new Error('Cannot update a deleted user');
    }

    // Update fields if provided
    if (data.username !== undefined) {
      user.username = data.username;
    }
    if (data.firstName !== undefined) {
      user.firstName = data.firstName;
    }
    if (data.role !== undefined) {
      user.role = data.role;
    }
    if (data.isBanned !== undefined) {
      user.isBanned = data.isBanned;
    }

    await user.save();

    // Clear user cache
    cacheService.del(CacheKeys.user(user.telegramId));
    cacheService.clearPattern('users:list:');

    logger.info('User updated', {
      userId: user._id,
      telegramId: user.telegramId,
      updates: Object.keys(data)
    });

    return user;
  }

  static async deleteUser(
    userId: string | Types.ObjectId
  ): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isDeleted) {
      throw new Error('User already deleted');
    }

    // Soft delete: set isDeleted flag to true
    user.isDeleted = true;
    await user.save();

    // Clear user cache
    cacheService.del(CacheKeys.user(user.telegramId));
    cacheService.clearPattern('users:list:');

    logger.info('User deleted (soft delete)', {
      userId: user._id,
      telegramId: user.telegramId,
      username: user.username
    });

    return user;
  }
}

