import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 1. Define what our User looks like
interface User {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
});

// 3. Create the Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // --- MOCK LOGIN START ---
    // In Day 7, we will replace this with: api.get('/users/me')
    
    // For testing today, toggle this comment to see different views:
    
    // SCENARIO A: You are an ADMIN
    const mockUser = { id: '1', username: 'Boss', role: 'ADMIN' as const };
    
    // SCENARIO B: You are a BUYER (Uncomment below to test buyer view)
    // const mockUser = { id: '2', username: 'Buyer1', role: 'USER' as const };

    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 500); // Simulate a small network delay
    // --- MOCK LOGIN END ---

  }, []);

  // Helper boolean
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Create a custom hook for easy access
export const useAuth = () => useContext(AuthContext);