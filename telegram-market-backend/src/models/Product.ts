import mongoose, { Schema, Document, Types } from 'mongoose';

export enum ProductStatus {
  PENDING = 'PENDING',       // Waiting for Admin review
  PUBLISHED = 'PUBLISHED',   // Visible to Buyers
  SOLD = 'SOLD',             // No longer available
  REJECTED = 'REJECTED'      // Admin denied
}

export interface IProduct extends Document {
  seller: Types.ObjectId;    // Reference to the original User (HIDDEN from API)
  title: string;
  description: string;
  originalPrice: number;
  mediaFileId: string;       // Telegram File ID for photo/video
  status: ProductStatus;
  
  // Admin Fields (Populated only when status is PUBLISHED)
  approvedBy?: Types.ObjectId;
  adminContact?: {
    username: string;      // Admin's Username to show to buyer
    phoneNumber: string;   // Admin's Phone to show to buyer
  };
  finalPrice?: number;     // Admin might adjust price
}

const ProductSchema: Schema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  originalPrice: { type: Number, required: true },
  mediaFileId: { type: String }, // We store the Telegram File ID
  
  status: { 
    type: String, 
    enum: Object.values(ProductStatus), 
    default: ProductStatus.PENDING 
  },

  // Fields added by Admin during approval
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  finalPrice: { type: Number },
  adminContact: {
    username: { type: String },
    phoneNumber: { type: String }
  }
}, {
  timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);