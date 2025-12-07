import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Globe, Calendar, Clock, User, Phone, MessageCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import api, { getImageUrl } from '../utils/api';
import { type Product, formatAvailableTime } from '../types';
import { showToast } from '../components/Toast';

const ProductDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  // Fetch product details
  const fetchProduct = async () => {
    if (!id) {
      setError('Product ID not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await api.get(`/products/${id}`);
      
      if (res.data?.success && res.data?.data) {
        setProduct(res.data.data);
      } else {
        setError('Product not found');
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      
      if (err.response?.status === 404) {
        setError('Product not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this product');
      } else {
        setError(err.response?.data?.message || 'Failed to load product details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Handle Buy Action (Opens Chat with Admin)
  const handleBuy = () => {
    if (!product?.adminContact?.username) {
      showToast('Contact information not available', 'error');
      return;
    }

    const username = product.adminContact.username.replace('@', '');
    const text = `Hi! I am interested in "${product.title}" (ID: ${product._id}). Is it available?`;
    const url = `https://t.me/${username}?text=${encodeURIComponent(text)}`;
    
    WebApp.openTelegramLink(url);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-10"></div>
          </div>
        </header>
        
        {/* Content Skeleton */}
        <div className="animate-pulse">
          <div className="h-80 bg-gray-200"></div>
          <div className="bg-white p-4 space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">Product Details</h1>
            <div className="w-10"></div>
          </div>
        </header>
        
        <div className="p-4">
          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Product Details</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main>
        {/* Product Image Section */}
        <div className="relative">
          <div 
            className="h-80 bg-gray-200 bg-cover bg-center flex items-end justify-center"
            style={{
              backgroundImage: product.mediaFileId && !imageError 
                ? `linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%), url(${getImageUrl(product.mediaFileId)})`
                : undefined
            }}
          >
            {(!product.mediaFileId || imageError) && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <span className="text-sm">No Image</span>
                </div>
              </div>
            )}
            
            {/* Image dots indicator (ready for multi-image) */}
            <div className="flex justify-center gap-2 p-5 relative z-10">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white/50"></div>
              <div className="w-2 h-2 rounded-full bg-white/50"></div>
            </div>
          </div>
          
          {/* Hidden img tag to detect load errors */}
          {product.mediaFileId && (
            <img 
              src={getImageUrl(product.mediaFileId)} 
              alt="" 
              className="hidden"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Title & Price Section */}
        <div className="bg-white px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {product.title}
          </h1>
          
          {/* Status Badge */}
          {product.status && product.status !== 'PUBLISHED' && (
            <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
              product.status === 'SOLD' ? 'bg-gray-100 text-gray-700' :
              product.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {product.status}
            </span>
          )}
          
          {/* Price */}
          <p className="text-2xl font-bold text-blue-600 mt-3">
            ${product.finalPrice || product.originalPrice}
          </p>
        </div>

        {/* Info Chips */}
        {(product.madeIn || product.expirationDateRaw || (product.availableTimeValue && product.availableTimeUnit)) && (
          <div className="bg-white px-4 pb-4 pt-1">
            <div className="flex flex-wrap gap-2">
              {/* Made In */}
              {product.madeIn && (
                <div className="flex h-10 items-center gap-2 rounded-xl bg-gray-100 px-4 border border-gray-200">
                  <Globe size={18} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-800">
                    Made in: {product.madeIn}
                  </span>
                </div>
              )}
              
              {/* Expiration Date */}
              {product.expirationDateRaw && (
                <div className="flex h-10 items-center gap-2 rounded-xl bg-orange-50 px-4 border border-orange-200">
                  <Calendar size={18} className="text-orange-500" />
                  <span className="text-sm font-medium text-orange-800">
                    Expires: {product.expirationDateRaw}
                  </span>
                </div>
              )}
              
              {/* Available Time */}
              {product.availableTimeValue && product.availableTimeUnit && (
                <div className="flex h-10 items-center gap-2 rounded-xl bg-purple-50 px-4 border border-purple-200">
                  <Clock size={18} className="text-purple-500" />
                  <span className="text-sm font-medium text-purple-800">
                    Available: {formatAvailableTime(product.availableTimeValue, product.availableTimeUnit)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="h-2 bg-gray-100"></div>

        {/* Contact Section */}
        {product.adminContact && (product.adminContact.username || product.adminContact.phoneNumber) && (
          <>
            <div className="bg-white px-4 py-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-3">
                {/* Username */}
                {product.adminContact.username && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telegram</p>
                      <p className="font-medium">{product.adminContact.username}</p>
                    </div>
                  </div>
                )}
                
                {/* Phone Number */}
                {product.adminContact.phoneNumber && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{product.adminContact.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Separator */}
            <div className="h-2 bg-gray-100"></div>
          </>
        )}

        {/* Description Section */}
        {product.description && (
          <div className="bg-white px-4 py-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}
      </main>

      {/* Sticky Footer - Buy Now Button */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
        <button
          onClick={handleBuy}
          className="w-full h-14 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <MessageCircle size={20} />
          Buy Now
        </button>
      </footer>
    </div>
  );
};

export default ProductDetailsPage;

