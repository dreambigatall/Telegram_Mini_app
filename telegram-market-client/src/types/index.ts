// ============================================
// ENUMS
// ============================================

// User Role Enum - All possible user roles
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'SELLER' | 'BUYER';

// Available Time Unit Enum - For admin-only product availability
export type AvailableTimeUnit = 'hour' | 'day' | 'weeks' | 'month';

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  _id: string;
  title: string;
  description: string;
  originalPrice: number; // The price the seller set
  finalPrice?: number;   // The price the Admin set (if published)
  status: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED';
  
  // Image fields
  images?: string[];      // NEW: Array of Telegram file IDs (up to 4)
  mediaFileId?: string;   // Legacy: First image (backward compatibility)
  
  // Product info fields
  madeIn?: string;                    // Country/location of manufacture
  expirationDate?: string;            // ISO date string (parsed by backend)
  expirationDateRaw?: string;         // Original format entered by user
  availableTimeValue?: number;        // Admin-only: time value (1-1000)
  availableTimeUnit?: AvailableTimeUnit; // Admin-only: time unit
  
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
  updatedAt?: string;
}

// Submit Product Payload (for sellers) - Used with FormData
export interface SubmitProductPayload {
  title: string;
  description?: string;
  originalPrice: number;
  madeIn?: string;
  expirationDate?: string;
  images?: File[];        // NEW: File objects to upload (up to 4)
  mediaFileId?: string;   // Legacy: Still supported for backward compatibility
}

// Update Product Payload (for admins) - Used with FormData
export interface UpdateProductPayload {
  title?: string;
  description?: string;
  finalPrice?: number;
  madeIn?: string;
  expirationDate?: string;
  availableTimeValue?: number | null;
  availableTimeUnit?: AvailableTimeUnit | null;
  images?: File[];        // NEW: File objects to upload
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: Product['status'];
}

// ============================================
// IMAGE UPLOAD CONSTANTS
// ============================================

export const IMAGE_UPLOAD_CONFIG = {
  MAX_IMAGES: 4,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
};

// ============================================
// INVITE TYPES
// ============================================

export interface InviteResponse {
  success: boolean;
  inviteCode: string;
  role: string;
  link: string;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  _id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: UserRole;
  isBanned: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

// Update User Payload
export interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  role?: UserRole;
  isBanned?: boolean;
}

// User List Response
export interface UserListResponse {
  success: boolean;
  message?: string;
  data: User[];
  total?: number;
  page?: number;
  totalPages?: number;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a user role can submit products
 * SELLER, USER, ADMIN, SUPER_ADMIN can submit
 */
export const canSubmitProducts = (role?: UserRole): boolean => {
  if (!role) return false;
  return ['SELLER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
};

/**
 * Check if a user role can view the product feed
 * BUYER, USER, ADMIN, SUPER_ADMIN can view
 */
export const canViewFeed = (role?: UserRole): boolean => {
  if (!role) return false;
  return ['BUYER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
};

/**
 * Format available time for display
 * Handles the plural/singular quirk in the backend
 */
export const formatAvailableTime = (value?: number, unit?: AvailableTimeUnit): string | null => {
  if (!value || !unit) return null;
  
  let displayUnit = unit;
  if (value === 1) {
    displayUnit = unit === 'weeks' ? 'week' : unit;
  } else {
    if (unit !== 'weeks') {
      displayUnit = `${unit}s` as AvailableTimeUnit;
    }
  }
  
  return `${value} ${displayUnit}`;
};

/**
 * Get product image URLs from product object
 * Prefers images array, falls back to mediaFileId
 */
export const getProductImageIds = (product: Product): string[] => {
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  if (product.mediaFileId) {
    return [product.mediaFileId];
  }
  return [];
};

/**
 * Validate image file for upload
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' 
    };
  }
  
  // Check file size
  if (file.size > IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'File size must be less than 10MB' 
    };
  }
  
  return { valid: true };
};
