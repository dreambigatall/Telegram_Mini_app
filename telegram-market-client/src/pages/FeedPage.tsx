import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { getImageUrl, apiGet } from '../utils/api';
import { type Product, getProductImageIds } from '../types';
import { showToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { FeedPageSkeleton } from '../components/Skeleton';
import { debounce } from '../utils/requestManager';

const FeedPage = () => {
  const navigate = useNavigate();
  const { canViewFeed, isSeller, isLoading: authLoading } = useAuth();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Requests are automatically cleaned up by request manager
    };
  }, []);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(45);
  const [total, setTotal] = useState(0);

  // Image error tracking
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Ref for debounced refresh
  const refreshFeedRef = useRef<(() => void) | null>(null);

  // 1. Fetch the Feed
  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    
    try {
      const params = {
        page: page.toString(),
        limit: limit.toString(),
      };
      
      const res = await apiGet<{
        success: boolean;
        data: Product[];
        total?: number;
      }>(`/products/feed?${new URLSearchParams(params)}`); // Allow caching for feed
      
      // Handle different response structures safely
      let productsData: Product[] = [];
      
      if (res) {
        if (res.success && Array.isArray(res.data)) {
          productsData = res.data;
          setTotal(res.total || 0);
        } else {
          const resData = res as { data?: Product[]; total?: number } | Product[];
          if (Array.isArray(resData)) {
            productsData = resData;
            setTotal(productsData.length);
          } else if (Array.isArray(resData.data)) {
            productsData = resData.data;
            setTotal(resData.total || productsData.length);
          }
        }
      }
      
      setProducts(productsData);
      
      if (isRefresh) {
        try {
          WebApp.HapticFeedback?.impactOccurred('light');
        } catch {
          // Haptic feedback not available, ignore
        }
      }
    } catch (err: unknown) {
      // Handle different error types specifically
      const errorObj = err as { response?: { status?: number; data?: { message?: string; error?: string } }; enhancedMessage?: string };
      if (errorObj.response?.status === 429) {
        // 429 - Rate Limit
        const message = errorObj.response?.data?.message || errorObj.enhancedMessage || 'Too many requests. Please wait a moment.';
        setError(message);
        showToast(message, 'warning');
      } else if (errorObj.response?.status === 401) {
        // 401 - Authentication issue - show specific message
        const message = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Session expired. Please refresh the page.';
        setError(message);
      } else if (errorObj.response?.status === 403) {
        setError('You do not have permission to view the marketplace.');
      } else {
        // Other errors (network, 500, etc.)
        const errorMessage = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Failed to load items.';
        setError(errorMessage);
      }
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit]);

  // Debounced version of fetchFeed (500ms delay)
  useEffect(() => {
    refreshFeedRef.current = debounce(() => fetchFeed(true), 500);
    return () => {
      if (refreshFeedRef.current) {
        refreshFeedRef.current = null;
      }
    };
  }, [fetchFeed]);

  useEffect(() => {
    if (canViewFeed) {
      fetchFeed();
    }
  }, [canViewFeed, fetchFeed]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const pullDistance = e.touches[0].clientY - pullStartY;
    if (pullDistance > 80 && !refreshing) {
      setIsPulling(false);
      // Use debounced refresh
      if (refreshFeedRef.current) {
        refreshFeedRef.current();
      } else {
        fetchFeed(true);
      }
    }
  }, [isPulling, pullStartY, refreshing, fetchFeed]);

  const handleTouchEnd = useCallback(() => {
    setIsPulling(false);
    setPullStartY(0);
  }, []);

  // 2. Handle Buy Action (Opens Chat with Admin)
  const handleBuy = (product: Product) => {
    // Haptic feedback on buy
    try {
      WebApp.HapticFeedback?.impactOccurred('medium');
    } catch {
      // Haptic feedback not available, ignore
    }

    if (!product.adminContact?.username) {
      showToast('Admin contact missing for this item.', 'error');
      return;
    }

    const text = `Hi! I am interested in "${product.title}". Is it available?`;
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
    <div className="bg-gray-100 min-h-screen pb-24">
      {/* Header skeleton */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="h-7 w-32 bg-gray-200 rounded animate-shimmer" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-shimmer" />
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-shimmer" />
          </div>
        </div>
      </header>
      <main className="p-4">
        <FeedPageSkeleton count={6} />
      </main>
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
    <div 
      className="bg-gray-100 min-h-screen pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-2 bg-blue-500 text-white text-sm font-medium">
          <Loader2 className="animate-spin mr-2" size={16} />
          Refreshing...
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Fresh Drops ⚡</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {total || products?.length || 0} items
            </span>
            <button 
              onClick={() => {
                if (refreshFeedRef.current) {
                  refreshFeedRef.current();
                } else {
                  fetchFeed(true);
                }
              }}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
              title="Refresh feed"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
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
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleDetails(product)}
                >
                  {/* Product Image - Compact */}
                  <div className="h-32 bg-gray-100 overflow-hidden relative">
                    {(() => {
                      const imageIds = getProductImageIds(product);
                      const firstImageId = imageIds[0];
                      
                      if (firstImageId && !failedImages.has(product._id)) {
                        return (
                          <>
                            <img 
                              src={getImageUrl(firstImageId)} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(product._id)}
                            />
                            {/* Image count badge */}
                            {imageIds.length > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                +{imageIds.length - 1}
                              </div>
                            )}
                          </>
                        );
                      }
                      
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon size={24} className="opacity-50"/>
                          <span className="text-[10px] mt-1">No Image</span>
                        </div>
                      );
                    })()}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDetails(product);
                        }}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md text-xs font-semibold hover:bg-gray-300 active:scale-95 transition-all"
                      >
                        Details
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuy(product);
                        }}
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
