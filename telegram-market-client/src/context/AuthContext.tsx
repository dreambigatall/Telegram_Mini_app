import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../utils/api';
import WebApp from '@twa-dev/sdk';

// 1. Define what our User looks like
interface User {
  id: string;
  username?: string;
  firstName?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned?: boolean;
}

// Backend response type
interface BackendUserResponse {
  _id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  error: null,
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
          console.warn('⚠️ Running in dev mode without initData. Using mock user.');
          const mockUser: User = {
            id: 'dev-mock-id',
            username: 'DevUser',
            role: 'ADMIN',
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
      } catch (err: any) {
        console.error('Auth error:', err);
        
        // Handle different error scenarios
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.message || err.response.data?.error || 'Authentication failed';

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
        } else if (err.request) {
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

  // Helper boolean - check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Create a custom hook for easy access
export const useAuth = () => useContext(AuthContext);