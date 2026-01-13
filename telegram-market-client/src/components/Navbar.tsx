import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, PlusCircle, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the user status and permissions
  const { 
    isAdmin, 
    isSuperAdmin, 
    isLoading,
    canViewFeed,      // NEW: Can user view the marketplace?
    canSubmitProducts // NEW: Can user submit products?
  } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Don't show navbar while loading user data (avoids flickering)
  if (isLoading) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        
        {/* BUY TAB - Hidden for SELLER role */}
        {canViewFeed && (
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center transition-colors ${
              isActive('/') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShoppingBag size={24} />
            <span className="text-xs mt-1">Buy</span>
          </button>
        )}

        {/* SELL TAB - Hidden for BUYER role */}
        {canSubmitProducts && (
          <button 
            onClick={() => navigate('/sell')}
            className={`flex flex-col items-center transition-colors ${
              isActive('/sell') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <PlusCircle size={24} />
            <span className="text-xs mt-1">Sell</span>
          </button>
        )}

        {/* ADMIN TAB - Only for ADMIN and SUPER_ADMIN */}
        {isAdmin && (
          <button 
            onClick={() => navigate('/admin')}
            className={`flex flex-col items-center transition-colors ${
              isActive('/admin') ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShieldCheck size={22} />
            <span className="text-xs mt-1">Admin</span>
          </button>
        )}

        {/* USERS TAB - Only for SUPER_ADMIN */}
        {isSuperAdmin && (
          <button 
            onClick={() => navigate('/users')}
            className={`flex flex-col items-center transition-colors ${
              isActive('/users') ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users size={22} />
            <span className="text-xs mt-1">Users</span>
          </button>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
