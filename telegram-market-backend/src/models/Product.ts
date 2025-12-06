import mongoose, { Schema, Document, Types } from 'mongoose';

export enum ProductStatus {
  PENDING = 'PENDING',       // Waiting for Admin review
  PUBLISHED = 'PUBLISHED',   // Visible to Buyers
  SOLD = 'SOLD',             // No longer available
  REJECTED = 'REJECTED',     // Admin denied
  DELETED = 'DELETED'        // Soft deleted by Admin
}

export enum AvailableTimeUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEKS = 'weeks',
  MONTH = 'month'
}

export interface IProduct extends Document {
  seller: Types.ObjectId;    // Reference to the original User (HIDDEN from API)
  title: string;
  description: string;
  originalPrice: number;
  mediaFileId: string;       // Telegram File ID for photo/video
  status: ProductStatus;
  madeIn?: string;          // Country/manufacturing location (optional)
  expirationDate?: Date;     // Product expiration date (optional, parsed)
  expirationDateRaw?: string; // Original expiration date string as entered by user (optional)
  
  // Admin Fields (Populated only when status is PUBLISHED)
  approvedBy?: Types.ObjectId;
  adminContact?: {
    username: string;      // Admin's Username to show to buyer
    phoneNumber: string;   // Admin's Phone to show to buyer
  };
  finalPrice?: number;     // Admin might adjust price
  availableTimeValue?: number;  // Product available time value (optional, set by admin)
  availableTimeUnit?: AvailableTimeUnit; // Product available time unit (optional, set by admin)
}

const ProductSchema: Schema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  originalPrice: { type: Number, required: true },
  mediaFileId: { type: String }, // We store the Telegram File ID
  madeIn: { type: String }, // Country/manufacturing location (optional)
  expirationDate: { type: Date }, // Product expiration date (optional, parsed)
  expirationDateRaw: { type: String }, // Original expiration date string as entered by user (optional)
  
  status: { 
    type: String, 
    enum: Object.values(ProductStatus), 
    default: ProductStatus.PENDING,
    index: true // Index for filtering by status
  },

  // Fields added by Admin during approval
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  finalPrice: { type: Number },
  adminContact: {
    username: { type: String },
    phoneNumber: { type: String }
  },
  availableTimeValue: { type: Number }, // Product available time value (optional, set by admin)
  availableTimeUnit: { 
    type: String, 
    enum: Object.values(AvailableTimeUnit) 
  } // Product available time unit (optional, set by admin)
}, {
  timestamps: true
});

// Compound indexes for common queries
ProductSchema.index({ status: 1, createdAt: -1 }); // For pending products sorted by date
ProductSchema.index({ status: 1, updatedAt: -1 }); // For published products feed
ProductSchema.index({ seller: 1, status: 1 }); // For user's products by status

export default mongoose.model<IProduct>('Product', ProductSchema);