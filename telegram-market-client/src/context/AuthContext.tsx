import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../utils/api';
import WebApp from '@twa-dev/sdk';
import { type UserRole } from '../types';

// 1. Define what our User looks like
interface User {
  id: string;
  username?: string;
  firstName?: string;
  role: UserRole;  // Updated to include SELLER and BUYER
  isBanned?: boolean;
}

// Backend response type
interface BackendUserResponse {
  _id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: UserRole;  // Updated to include SELLER and BUYER
  isBanned: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  // Role checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSeller: boolean;      // NEW: Check if user is SELLER role
  isBuyer: boolean;       // NEW: Check if user is BUYER role
  // Permission checks
  canSubmitProducts: boolean;  // NEW: Can user submit products?
  canViewFeed: boolean;        // NEW: Can user view the feed?
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  // Role checks
  isAdmin: false,
  isSuperAdmin: false,
  isSeller: false,
  isBuyer: false,
  // Permission checks
  canSubmitProducts: false,
  canViewFeed: false,
});

// Helper function to transform backend user to frontend user
const transformUser = (backendUser: BackendUserResponse): User => {
  return {
    id: backendUser._id,
    username: backendUser.username,
    firstName: backendUser.firstName,
    role: backendUser.role,
    isBanned: backendUser.isBanned,
  };
};

// 3. Create the Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have initData (Telegram environment)
        const initData = WebApp.initData;
        
        // Allow browser testing with a flag (dev mode only)
        const isDevMode = import.meta.env.DEV;
        if (!initData && !isDevMode) {
          setError('This app must be opened from Telegram.');
          setIsLoading(false);
          return;
        }

        // If no initData in dev mode, use mock user for testing
        if (!initData && isDevMode) {
          // You can change this role to test different user types:
          // 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SELLER' | 'BUYER'
          const mockUser: User = {
            id: 'dev-mock-id',
            username: 'DevUser',
            role: 'ADMIN',  // Change this to test different roles
            isBanned: false,
          };
          setUser(mockUser);
          setIsLoading(false);
          return;
        }

        // Make API call to get current user
        const response = await api.get<{ success: boolean; data: BackendUserResponse }>('/users/me');

        if (response.data.success && response.data.data) {
          // Transform backend user to frontend format
          const transformedUser = transformUser(response.data.data);
          
          // Check if user is banned
          if (transformedUser.isBanned) {
            setError('You are banned from this marketplace.');
            setUser(null);
          } else {
            setUser(transformedUser);
          }
        } else {
          setError('Failed to retrieve user information.');
          setUser(null);
        }
      } catch (err: unknown) {
        // Handle different error scenarios
        const errorObj = err as { response?: { status?: number; data?: { message?: string; error?: string } }; request?: unknown };
        if (errorObj.response) {
          const status = errorObj.response.status;
          const message = errorObj.response.data?.message || errorObj.response.data?.error || 'Authentication failed';

          if (status === 401) {
            setError('Not authenticated. Please make sure you are logged in.');
          } else if (status === 403) {
            if (message.includes('banned')) {
              setError('You are banned from this marketplace.');
            } else if (message.includes('invite')) {
              setError('Access Denied. You need an invite to join this marketplace.');
            } else {
              setError('Access Denied. You do not have permission.');
            }
          } else {
            setError(message || 'Failed to authenticate. Please try again.');
          }
        } else if (errorObj.request) {
          // Network error
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }

        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // ============================================
  // ROLE CHECKS
  // ============================================
  
  // Admin roles
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  // NEW: Specialized roles
  const isSeller = user?.role === 'SELLER';
  const isBuyer = user?.role === 'BUYER';

  // ============================================
  // PERMISSION CHECKS
  // ============================================
  
  // NEW: Can submit products (SELLER, USER, ADMIN, SUPER_ADMIN)
  const canSubmitProducts = user !== null && ['SELLER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  
  // NEW: Can view feed (BUYER, USER, ADMIN, SUPER_ADMIN)
  const canViewFeed = user !== null && ['BUYER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error,
      // Role checks
      isAdmin, 
      isSuperAdmin,
      isSeller,
      isBuyer,
      // Permission checks
      canSubmitProducts,
      canViewFeed,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Create a custom hook for easy access
// Note: This is exported alongside components, but fast refresh still works for the component
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
