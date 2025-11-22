export interface Product {
    _id: string;
    title: string;
    description: string;
    originalPrice: number; // The price the seller set
    finalPrice?: number;   // The price the Admin set (if published)
    status: 'PENDING' | 'PUBLISHED' | 'SOLD';
    mediaFileId?: string;
    adminContact?: {
      username: string;
      phoneNumber?: string;
    };
    createdAt: string;
  }

  // ... existing Product interface

export interface InviteResponse {
  success: boolean;
  inviteCode: string;
  role: string;
  link: string;
}