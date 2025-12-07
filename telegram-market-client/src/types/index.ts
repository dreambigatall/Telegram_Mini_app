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
  mediaFileId?: string;
  
  // NEW FIELDS
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

// Submit Product Payload (for sellers)
export interface SubmitProductPayload {
  title: string;
  description?: string;
  originalPrice: number;
  mediaFileId?: string;
  madeIn?: string;           // NEW: Optional country/location
  expirationDate?: string;   // NEW: Flexible date format
}

// Update Product Payload (for admins)
export interface UpdateProductPayload {
  title?: string;
  description?: string;
  finalPrice?: number;
  madeIn?: string;                          // NEW: Editable by admin
  expirationDate?: string;                  // NEW: Editable by admin
  availableTimeValue?: number | null;       // NEW: Admin-only field
  availableTimeUnit?: AvailableTimeUnit | null; // NEW: Admin-only field
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: Product['status'];
}

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
  role: UserRole;  // Updated to use UserRole type
  isBanned: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

// Update User Payload
export interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  role?: UserRole;  // Updated to use UserRole type
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

// ============================================
// HELPER FUNCTIONS FOR ROLE CHECKS
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
  
  // Handle the 'weeks' vs singular units quirk
  let displayUnit = unit;
  if (value === 1) {
    // Singular
    displayUnit = unit === 'weeks' ? 'week' : unit;
  } else {
    // Plural
    if (unit !== 'weeks') {
      displayUnit = `${unit}s` as AvailableTimeUnit;
    }
  }
  
  return `${value} ${displayUnit}`;
};
