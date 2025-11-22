import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from './User';

export interface IInvite extends Document {
  code: string;           // The unique string, e.g., "invite-55a-bc2"
  roleToAssign: UserRole; // The role the new user gets
  createdBy: Types.ObjectId; // Which admin created this invite
  isUsed: boolean;
  usedBy?: Types.ObjectId;   // Who used it
}

const InviteSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  roleToAssign: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isUsed: { type: Boolean, default: false, index: true },
  usedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Compound index for finding unused invites by code
InviteSchema.index({ code: 1, isUsed: 1 });

export default mongoose.model<IInvite>('Invite', InviteSchema);