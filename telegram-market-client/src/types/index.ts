export interface Product {
    _id: string;
    title: string;
    description: string;
    originalPrice: number; // The price the seller set
    finalPrice?: number;   // The price the Admin set (if published)
    status: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED';
    mediaFileId?: string;
    adminContact?: {
      username: string;
      phoneNumber?: string;
    };
    seller?: {
      _id: string;
      username?: string;
      firstName?: string;
      telegramId?: string;
    };
    createdAt: string;
  }

  // Update Product Payload
export interface UpdateProductPayload {
  title?: string;
  description?: string;
  finalPrice?: number;
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: Product['status'];
}

  // ... existing Product interface

export interface InviteResponse {
  success: boolean;
  inviteCode: string;
  role: string;
  link: string;
}

// User types
export interface User {
  _id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

// Update User Payload
export interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  role?: User['role'];
  isBanned?: boolean;
}

// User List Response
export interface UserListResponse {
  success: boolean;
  message?: string;
  data: User[];
  total?: number;  // Backend returns total at root level
  page?: number;
  totalPages?: number;
  count?: number;
  // Also support pagination object format for compatibility
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}