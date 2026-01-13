import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER', // Acts as both Buyer and Seller
  SELLER = 'SELLER', // Can only sell (submit products)
  BUYER = 'BUYER' // Can only buy (view feed)
}

export interface IUser extends Document {
  telegramId: string; // Stored as String to prevent BigInt overflow issues
  username?: string;
  firstName?: string;
  role: UserRole;
  isBanned: boolean;
  isDeleted: boolean; // Soft delete flag
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  telegramId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  username: { type: String },
  firstName: { type: String },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  },
  isBanned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

export default mongoose.model<IUser>('User', UserSchema);