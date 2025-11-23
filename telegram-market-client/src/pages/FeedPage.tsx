import { useEffect, useState } from 'react';
import { ShoppingBag, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import api, { getImageUrl } from '../utils/api';
import { type Product } from '../types';
import { showToast } from '../components/Toast';

const FeedPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch the Feed
  const fetchFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/products/feed');
      
      // Backend uses successWithPagination which returns: { success: true, data: [...], total, page, ... }
      // Handle different response structures safely
      let productsData: Product[] = [];
      
      if (res.data) {
        if (res.data.success && Array.isArray(res.data.data)) {
          // Standard response format
          productsData = res.data.data;
        } else if (Array.isArray(res.data.data)) {
          // Response has data array
          productsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          // Response is directly an array
          productsData = res.data;
        }
      }
      
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error fetching feed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load items.';
      setError(errorMessage);
      setProducts([]); // Ensure products is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // 2. Handle Buy Action (Opens Chat with Admin)
  const handleBuy = (product: Product) => {
    if (!product.adminContact?.username) {
      showToast('Admin contact missing for this item.', 'error');
      return;
    }

    // Construct a message so the Admin knows which item
    const text = `Hi! I am interested in "${product.title}" (ID: ${product._id}). Is it available?`;
    const url = `https://t.me/${product.adminContact.username}?text=${encodeURIComponent(text)}`;
    
    // Open Telegram Chat
    WebApp.openTelegramLink(url);
  };

  // --- RENDER STATES ---

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-blue-600">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  if (error) return (
    <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg m-4">
      {error}
    </div>
  );

  return (
    <div className="p-4 pb-24"> {/* Extra padding for bottom navbar */}
      
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fresh Drops ⚡</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {products?.length || 0} items
          </span>
          <button 
            onClick={fetchFeed}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
            title="Refresh feed"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {(!products || products.length === 0) ? (
        <div className="text-center py-10 text-gray-400">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
          <p>No items available right now.</p>
          <p className="text-sm mt-2">Check back later!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(products || []).map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Image Placeholder (Since we can't show raw file_ids easily yet) */}
              {/* REAL IMAGE RENDER */}
<div className="h-48 bg-gray-100 overflow-hidden flex justify-center items-center">
  {product.mediaFileId ? (
    <img 
      // We point to OUR backend, which proxies the image from Telegram
      src={getImageUrl(product.mediaFileId)} 
      alt={product.title}
      className="w-full h-full object-cover"
      onError={(e) => {
        // Fallback if image fails
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <div className="flex flex-col items-center text-gray-400">
      <ImageIcon size={32} className="mb-2 opacity-50"/>
      <span className="text-xs">No Image</span>
    </div>
  )}
</div>

              {/* Card Content */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800 truncate pr-2">
                    {product.title}
                  </h3>
                  <span className="font-bold text-green-600">
                    ${product.finalPrice || product.originalPrice}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {product.description}
                </p>

                {/* Admin Phone Number - Only show if available */}
                {product.adminContact?.phoneNumber && (
                  <div className="bg-blue-50 p-2 rounded-lg mb-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">Contact:</p>
                    <p className="text-sm font-semibold text-blue-800">
                      📞 {product.adminContact.phoneNumber}
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => handleBuy(product)}
                  className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;