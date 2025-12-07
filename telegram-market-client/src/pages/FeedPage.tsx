import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import api, { getImageUrl } from '../utils/api';
import { type Product } from '../types';
import { showToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const FeedPage = () => {
  const navigate = useNavigate();
  const { canViewFeed, isSeller, isLoading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(45);
  const [total, setTotal] = useState(0);

  // Image error tracking
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // 1. Fetch the Feed
  const fetchFeed = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const res = await api.get(`/products/feed?${params}`);
      
      // Handle different response structures safely
      let productsData: Product[] = [];
      
      if (res.data) {
        if (res.data.success && Array.isArray(res.data.data)) {
          productsData = res.data.data;
          setTotal(res.data.total || 0);
        } else if (Array.isArray(res.data.data)) {
          productsData = res.data.data;
          setTotal(res.data.total || productsData.length);
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
          setTotal(productsData.length);
        }
      }
      
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error fetching feed:', err);
      
      if (err.response?.status === 403) {
        setError('You do not have permission to view the marketplace.');
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to load items.';
        setError(errorMessage);
      }
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewFeed) {
      fetchFeed();
    }
  }, [page, limit, canViewFeed]);

  // 2. Handle Buy Action (Opens Chat with Admin)
  const handleBuy = (product: Product) => {
    if (!product.adminContact?.username) {
      showToast('Admin contact missing for this item.', 'error');
      return;
    }

    const text = `Hi! I am interested in "${product.title}" (ID: ${product._id}). Is it available?`;
    const url = `https://t.me/${product.adminContact.username}?text=${encodeURIComponent(text)}`;
    
    WebApp.openTelegramLink(url);
  };

  // 3. Handle Details Click - Navigate to product details page
  const handleDetails = (product: Product) => {
    navigate(`/product/${product._id}`);
  };

  // Handle image error
  const handleImageError = (productId: string) => {
    setFailedImages(prev => new Set(prev).add(productId));
  };

  // --- RENDER STATES ---

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-blue-600">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // Access Denied for SELLER role
  if (!canViewFeed || isSeller) {
    return (
      <div className="p-4 pb-24">
        <div className="bg-amber-50 text-amber-800 p-6 rounded-xl border border-amber-200 text-center">
          <AlertCircle size={48} className="mx-auto mb-3 text-amber-500" />
          <h2 className="font-bold text-lg mb-2">Access Restricted</h2>
          <p className="text-sm">
            Your account is set up for selling only. 
            You cannot view the marketplace.
          </p>
          <button
            onClick={() => navigate('/sell')}
            className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            Go to Sell Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-blue-600">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  if (error) return (
    <div className="p-4 pb-24">
      <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg">
        <AlertCircle size={32} className="mx-auto mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchFeed}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Fresh Drops ⚡</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {total || products?.length || 0} items
            </span>
            <button 
              onClick={fetchFeed}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
              title="Refresh feed"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {(!products || products.length === 0) ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag size={56} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No items available right now.</p>
            <p className="text-sm mt-2">Check back later!</p>
          </div>
        ) : (
          <>
            {/* 2-Column Product Grid */}
            <div className="grid grid-cols-2 gap-3">
              {(products || []).map((product) => (
                <div 
                  key={product._id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Product Image - Compact */}
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    {product.mediaFileId && !failedImages.has(product._id) ? (
                      <img 
                        src={getImageUrl(product.mediaFileId)} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(product._id)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={24} className="opacity-50"/>
                        <span className="text-[10px] mt-1">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content - Compact */}
                  <div className="p-3">
                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {product.title}
                    </h3>
                    
                    {/* Price */}
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      ${product.finalPrice || product.originalPrice}
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => handleDetails(product)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md text-xs font-semibold hover:bg-gray-300 active:scale-95 transition-all"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => handleBuy(product)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {products.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(total / limit)}
                  totalItems={total}
                  itemsPerPage={limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default FeedPage;
