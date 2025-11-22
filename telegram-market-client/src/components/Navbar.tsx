import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, PlusCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the user status
  const { isAdmin, isLoading } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Don't show navbar while loading user data (optional, avoids flickering)
  if (isLoading) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center ${isActive('/') ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <ShoppingBag size={24} />
          <span className="text-xs mt-1">Buy</span>
        </button>

        <button 
          onClick={() => navigate('/sell')}
          className={`flex flex-col items-center ${isActive('/sell') ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <PlusCircle size={24} />
          <span className="text-xs mt-1">Sell</span>
        </button>

        {/* ONLY SHOW THIS IF ADMIN */}
        {isAdmin && (
          <button 
            onClick={() => navigate('/admin')}
            className={`flex flex-col items-center ${isActive('/admin') ? 'text-red-500' : 'text-gray-400'}`}
          >
            <ShieldCheck size={24} />
            <span className="text-xs mt-1">Admin</span>
          </button>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
