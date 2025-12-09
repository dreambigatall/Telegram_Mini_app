import { useEffect, useState, useRef, useCallback } from 'react';
import { Check, X, Copy, RefreshCw, UserPlus, Package, Edit, Trash2, Globe, Calendar, Clock } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import api, { getImageUrl, patchFormData, apiGet } from '../utils/api';
import { type Product, type UpdateProductPayload, formatAvailableTime, getProductImageIds } from '../types';
import { PriceInputModal } from '../components/PriceInputModal';
import { RejectModal } from '../components/RejectModal';
import { UpdateProductModal } from '../components/UpdateProductModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { showToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { AdminPageSkeleton } from '../components/Skeleton';
import { debounce } from '../utils/requestManager';

const AdminPage = () => {
  // Cleanup on unmount - cancel any pending requests
  useEffect(() => {
    return () => {
      // Requests are automatically cleaned up by request manager
      // But we can clear cache if needed
    };
  }, []);
  const [activeTab, setActiveTab] = useState<'products' | 'published' | 'invites'>('products');
  
  // State for Products
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishedLoading, setPublishedLoading] = useState(false);
  
  // Pagination state
  const [pendingPage, setPendingPage] = useState(1);
  const [publishedPage, setPublishedPage] = useState(1);
  const [limit] = useState(45);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(0);
  
  // State for Invites
  const [generatedLink, setGeneratedLink] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Refs for debounced functions
  const refreshPendingRef = useRef<(() => void) | null>(null);
  const refreshPublishedRef = useRef<(() => void) | null>(null);

  // --- 1. FETCH PENDING ITEMS ---
  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pendingPage.toString(),
        limit: limit.toString(),
      };
      
      // Backend returns array directly, not wrapped object
      const res = await apiGet<Product[] | { success: boolean; data: Product[]; total?: number }>(
        `/products/pending?${new URLSearchParams(params)}`, 
        undefined, 
        false
      ); // Don't cache pending items
      
      // Handle response - backend returns array directly OR wrapped object
      if (res) {
        if (Array.isArray(res)) {
          // Direct array response (current backend format)
          setPendingProducts(res);
          setPendingTotal(res.length);
        } else {
          const resData = res as { success?: boolean; data?: Product[]; total?: number };
          if (resData.success && Array.isArray(resData.data)) {
            // Wrapped response format (if backend changes)
            setPendingProducts(resData.data);
            setPendingTotal(resData.total || resData.data.length);
          } else if (Array.isArray(resData.data)) {
            // Fallback: check for data property
            setPendingProducts(resData.data);
            setPendingTotal(resData.total || resData.data.length);
          }
        }
      }
    } catch (err: unknown) {
      // Handle 429 (Rate Limit) specifically
      const errorObj = err as { response?: { status?: number; data?: { message?: string; error?: string } }; enhancedMessage?: string };
      if (errorObj.response?.status === 429) {
        const message = errorObj.response?.data?.message || errorObj.enhancedMessage || 'Too many requests. Please wait a moment.';
        showToast(message, 'warning');
      } else if (errorObj.response?.status === 401) {
        const message = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Session expired. Please refresh the page.';
        showToast(message, 'error');
      } else {
        // Other errors - show generic message
        const message = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Failed to load pending items';
        showToast(message, 'error');
      }
      
      setPendingProducts([]);
      setPendingTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pendingPage, limit]);

  // Debounced version of fetchPending (500ms delay)
  useEffect(() => {
    refreshPendingRef.current = debounce(fetchPending, 500);
    return () => {
      if (refreshPendingRef.current) {
        refreshPendingRef.current = null;
      }
    };
  }, [fetchPending]);

  // --- FETCH PUBLISHED ITEMS ---
  const fetchPublished = useCallback(async () => {
    setPublishedLoading(true);
    try {
      const params = {
        page: publishedPage.toString(),
        limit: limit.toString(),
      };
      
      const res = await apiGet<{
        success: boolean;
        data: Product[];
        total?: number;
      }>(`/products/feed?${new URLSearchParams(params)}`); // Allow caching for feed
      
      // Backend returns: { success: true, data: [...], total, page, ... }
      let productsData: Product[] = [];
      if (res) {
        if (res.success && Array.isArray(res.data)) {
          productsData = res.data;
          setPublishedTotal(res.total || 0);
        } else {
          const resData = res as { data?: Product[]; total?: number } | Product[];
          if (Array.isArray(resData)) {
            productsData = resData;
            setPublishedTotal(productsData.length);
          } else if (Array.isArray(resData.data)) {
            productsData = resData.data;
            setPublishedTotal(resData.total || productsData.length);
          }
        }
      }
      setPublishedProducts(productsData);
    } catch (err: unknown) {
      // Handle 429 (Rate Limit) specifically
      const errorObj = err as { response?: { status?: number; data?: { message?: string; error?: string } }; enhancedMessage?: string };
      if (errorObj.response?.status === 429) {
        const message = errorObj.response?.data?.message || errorObj.enhancedMessage || 'Too many requests. Please wait a moment.';
        showToast(message, 'warning');
      } else if (errorObj.response?.status === 401) {
        const message = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Session expired. Please refresh the page.';
        showToast(message, 'error');
      } else {
        // Other errors - show generic message
        const message = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Failed to load published items';
        showToast(message, 'error');
      }
      
      setPublishedProducts([]);
      setPublishedTotal(0);
    } finally {
      setPublishedLoading(false);
    }
  }, [publishedPage, limit]);

  // Debounced version of fetchPublished (500ms delay)
  useEffect(() => {
    refreshPublishedRef.current = debounce(fetchPublished, 500);
    return () => {
      if (refreshPublishedRef.current) {
        refreshPublishedRef.current = null;
      }
    };
  }, [fetchPublished]);

  useEffect(() => {
    if (activeTab === 'products') {
      // Use immediate fetch for initial load, debounced for refreshes
      fetchPending();
    } else if (activeTab === 'published') {
      fetchPublished();
    }
  }, [activeTab, pendingPage, publishedPage, limit, fetchPending, fetchPublished]);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    if (activeTab === 'products') {
      setPendingPage(1);
    } else if (activeTab === 'published') {
      setPublishedPage(1);
    }
  }, [activeTab]);

  // --- 2. APPROVE LOGIC ---
  const handleApproveClick = (product: Product) => {
    try {
      WebApp.HapticFeedback?.impactOccurred('light');
    } catch {
      // Haptic feedback not available, ignore
    }
    setSelectedProduct(product);
    setApproveModalOpen(true);
  };

  const handleApprove = async (finalPrice: number, adminUsername: string) => {
    if (!selectedProduct) return;

    try {
      await api.patch(`/products/${selectedProduct._id}/approve`, {
        finalPrice,
        adminUsername,
        adminPhone: '' // Optional
      });
      
      WebApp.HapticFeedback?.notificationOccurred('success');
      showToast('✅ Item Published!', 'success');
      
      // Use debounced refresh to prevent rate limiting
      if (refreshPendingRef.current) {
        refreshPendingRef.current();
      }
    } catch (err) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      throw err;
    }
  };

  // --- 3. REJECT LOGIC ---
  const handleRejectClick = (product: Product) => {
    try {
      WebApp.HapticFeedback?.impactOccurred('light');
    } catch {
      // Haptic feedback not available, ignore
    }
    setSelectedProduct(product);
    setRejectModalOpen(true);
  };

  const handleReject = async (reason: string) => {
    if (!selectedProduct) return;

    try {
      await api.patch(`/products/${selectedProduct._id}/reject`, { reason });
      WebApp.HapticFeedback?.notificationOccurred('success');
      showToast('❌ Item Rejected', 'success');
      
      // Use debounced refresh to prevent rate limiting
      if (refreshPendingRef.current) {
        refreshPendingRef.current();
      }
    } catch (err) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      throw err;
    }
  };

  // --- 4. GENERATE INVITE LOGIC ---
  const generateInvite = async () => {
    try {
      WebApp.HapticFeedback?.impactOccurred('light');
    } catch {
      // Haptic feedback not available, ignore
    }
    
    try {
      const res = await api.post('/admin/invite', { role: inviteRole });
      // Backend wraps response in { success, message, data: { link, ... } }
      setGeneratedLink(res.data.data?.link || res.data.link);
      WebApp.HapticFeedback?.notificationOccurred('success');
      showToast('Invite link generated!', 'success');
    } catch (err: unknown) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      const errorObj = err as { response?: { data?: { message?: string; error?: string } } };
      const message = errorObj.response?.data?.message || errorObj.response?.data?.error || 'Failed to generate invite. Are you an Admin?';
      showToast(message, 'error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    try {
      WebApp.HapticFeedback?.impactOccurred('light');
    } catch {
      // Haptic feedback not available, ignore
    }
    showToast('Link copied to clipboard!', 'success', 2000);
  };

  // --- UPDATE PRODUCT LOGIC ---
  const handleUpdateClick = (product: Product) => {
    setSelectedProduct(product);
    setUpdateModalOpen(true);
  };

  const handleUpdate = async (id: string, data: UpdateProductPayload, newImages?: File[]) => {
    try {
      // Haptic feedback
      try {
        WebApp.HapticFeedback?.impactOccurred('light');
      } catch {
        // Haptic feedback not available, ignore
      }

      // If new images are provided, use FormData; otherwise use JSON
      if (newImages && newImages.length > 0) {
        const formData = new FormData();
        
        // Add text fields
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.finalPrice !== undefined) formData.append('finalPrice', data.finalPrice.toString());
        if (data.madeIn) formData.append('madeIn', data.madeIn);
        if (data.expirationDate) formData.append('expirationDate', data.expirationDate);
        if (data.availableTimeValue !== undefined && data.availableTimeValue !== null) {
          formData.append('availableTimeValue', data.availableTimeValue.toString());
        }
        if (data.availableTimeUnit) formData.append('availableTimeUnit', data.availableTimeUnit);
        if (data.adminContact?.username) formData.append('adminContact[username]', data.adminContact.username);
        if (data.adminContact?.phoneNumber) formData.append('adminContact[phoneNumber]', data.adminContact.phoneNumber);
        if (data.status) formData.append('status', data.status);
        
        // Add new image files
        newImages.forEach((file) => {
          formData.append('images', file);
        });

        // Use centralized API for FormData
        await patchFormData(`/products/${id}`, formData);
      } else {
        // No new images, use regular JSON API call
        await api.patch(`/products/${id}`, data);
      }
      
      WebApp.HapticFeedback?.notificationOccurred('success');
      showToast('✅ Product updated successfully!', 'success');
      
      // Use debounced refresh to prevent rate limiting
      if (refreshPublishedRef.current) {
        refreshPublishedRef.current();
      }
      
      setUpdateModalOpen(false);
      setSelectedProduct(null);
    } catch (err: unknown) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      const errorObj = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const message = errorObj.response?.data?.error || errorObj.response?.data?.message || errorObj.message || 'Failed to update product';
      showToast(message, 'error');
      throw err; // Re-throw so modal can handle it
    }
  };

  // --- DELETE PRODUCT LOGIC ---
  const handleDeleteClick = (product: Product) => {
    try {
      WebApp.HapticFeedback?.impactOccurred('light');
    } catch {
      // Haptic feedback not available, ignore
    }
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await api.delete(`/products/${selectedProduct._id}`);
      WebApp.HapticFeedback?.notificationOccurred('success');
      showToast('✅ Product deleted successfully!', 'success');
      
      // Use debounced refresh to prevent rate limiting
      if (refreshPublishedRef.current) {
        refreshPublishedRef.current();
      }
      
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err: unknown) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      const errorObj = err as { response?: { data?: { error?: string; message?: string } } };
      const message = errorObj.response?.data?.error || errorObj.response?.data?.message || 'Failed to delete product';
      showToast(message, 'error');
      throw err; // Re-throw so modal can handle it
    }
  };

  // Reusable Product Info Tags Component
  const ProductInfoTags = ({ product }: { product: Product }) => (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {product.madeIn && (
        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
          <Globe size={10} />
          {product.madeIn}
        </span>
      )}
      {product.expirationDateRaw && (
        <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          <Calendar size={10} />
          {product.expirationDateRaw}
        </span>
      )}
      {product.availableTimeValue && product.availableTimeUnit && (
        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          <Clock size={10} />
          {formatAvailableTime(product.availableTimeValue, product.availableTimeUnit)}
        </span>
      )}
    </div>
  );

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* TABS */}
      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
        >
          <Package size={18} /> Review
        </button>
        <button 
          onClick={() => setActiveTab('published')}
          className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition ${activeTab === 'published' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
        >
          <Package size={18} /> Published
        </button>
        <button 
          onClick={() => setActiveTab('invites')}
          className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition ${activeTab === 'invites' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
        >
          <UserPlus size={18} /> Invites
        </button>
      </div>

      {/* --- CONTENT: PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-gray-700">Pending Approvals ({pendingTotal})</h2>
            <button 
              onClick={() => {
                if (refreshPendingRef.current) {
                  refreshPendingRef.current();
                } else {
                  fetchPending();
                }
              }} 
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <AdminPageSkeleton count={2} />
          ) : pendingProducts.length === 0 ? (
            <p className="text-gray-400">No pending items.</p>
          ) : null}

          {pendingProducts.map(p => {
            const imageIds = getProductImageIds(p);
            return (
            <div key={p._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                <span className="text-blue-600 font-bold text-lg">${p.originalPrice}</span>
              </div>
              
              {/* Show Seller Info (Only visible to Admin) */}
              <p className="text-sm text-gray-500 mb-3 font-medium flex items-center gap-1">
                <span className="text-gray-400">Seller:</span> 
                <span className="text-gray-800">{p.seller?.username || p.seller?.firstName || 'Unknown'}</span>
              </p>

              {/* NEW: Product Info Tags */}
              <ProductInfoTags product={p} />
              
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg leading-relaxed border border-gray-50">{p.description}</p>
              
              {/* Image Preview - Horizontal Scroll */}
              {imageIds.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-3 mb-4 snap-x scrollbar-hide">
                  {imageIds.map((id, idx) => (
                    <div key={idx} className="flex-shrink-0 w-64 h-56 bg-gray-50 rounded-xl overflow-hidden snap-center border border-gray-100 relative group">
                       <img 
                         src={getImageUrl(id)} 
                         className="w-full h-full object-contain mix-blend-multiply"
                         alt={`Product ${idx + 1}`}
                       />
                       <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-24 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200">
                  No images available
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => handleRejectClick(p)}
                  className="flex-1 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl flex justify-center items-center gap-2 hover:bg-red-50 hover:border-red-300 transition font-medium"
                >
                  <X size={18} /> Reject
                </button>
                <button 
                  onClick={() => handleApproveClick(p)}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-xl flex justify-center items-center gap-2 hover:bg-green-700 shadow-md hover:shadow-lg transition font-medium"
                >
                  <Check size={18} /> Publish
                </button>
              </div>
            </div>
            );
          })}

          {/* Pagination for Pending Products */}
          {!loading && pendingProducts.length > 0 && (
            <Pagination
              currentPage={pendingPage}
              totalPages={Math.ceil(pendingTotal / limit)}
              totalItems={pendingTotal}
              itemsPerPage={limit}
              onPageChange={setPendingPage}
            />
          )}
        </div>
      )}

      {/* --- CONTENT: PUBLISHED TAB --- */}
      {activeTab === 'published' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-gray-700">Published Products ({publishedTotal})</h2>
            <button 
              onClick={() => {
                if (refreshPublishedRef.current) {
                  refreshPublishedRef.current();
                } else {
                  fetchPublished();
                }
              }} 
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {publishedLoading ? (
            <AdminPageSkeleton count={2} />
          ) : publishedProducts.length === 0 ? (
            <p className="text-gray-400">No published items.</p>
          ) : null}

          {publishedProducts.map(p => {
            const imageIds = getProductImageIds(p);
            return (
            <div key={p._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                <span className="text-green-600 font-bold text-lg">${p.finalPrice || p.originalPrice}</span>
              </div>
              
              {/* Status Badge */}
              <div className="mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  p.status === 'SOLD' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {p.status}
                </span>
              </div>

              {/* NEW: Product Info Tags */}
              <ProductInfoTags product={p} />
              
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg leading-relaxed border border-gray-50">{p.description}</p>
              
              {/* Admin Contact Info */}
              {p.adminContact && (
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                  <span className="font-medium">Admin:</span> @{p.adminContact.username} {p.adminContact.phoneNumber && `(${p.adminContact.phoneNumber})`}
                </p>
              )}
              
              {/* Image Preview - Horizontal Scroll */}
              {imageIds.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-3 mb-4 snap-x scrollbar-hide">
                  {imageIds.map((id, idx) => (
                    <div key={idx} className="flex-shrink-0 w-64 h-56 bg-gray-50 rounded-xl overflow-hidden snap-center border border-gray-100">
                       <img 
                         src={getImageUrl(id)} 
                         className="w-full h-full object-contain mix-blend-multiply"
                         alt={`Product ${idx + 1}`}
                       />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-24 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200">
                  No images available
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateClick(p)}
                  className="flex-1 bg-white text-blue-600 border border-blue-200 py-2.5 rounded-xl flex justify-center items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition font-medium"
                >
                  <Edit size={18} /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteClick(p)}
                  className="flex-1 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl flex justify-center items-center gap-2 hover:bg-red-50 hover:border-red-300 transition font-medium"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
            );
          })}

          {/* Pagination for Published Products */}
          {!publishedLoading && publishedProducts.length > 0 && (
            <Pagination
              currentPage={publishedPage}
              totalPages={Math.ceil(publishedTotal / limit)}
              totalItems={publishedTotal}
              itemsPerPage={limit}
              onPageChange={setPublishedPage}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <>
          {/* Only render PriceInputModal for pending products (approval flow) */}
          {activeTab === 'products' && (
            <PriceInputModal
              isOpen={approveModalOpen}
              onClose={() => {
                setApproveModalOpen(false);
                setSelectedProduct(null);
              }}
              originalPrice={selectedProduct.originalPrice || 0}
              onSubmit={handleApprove}
            />
          )}
          {/* Only render RejectModal for pending products */}
          {activeTab === 'products' && (
            <RejectModal
              isOpen={rejectModalOpen}
              onClose={() => {
                setRejectModalOpen(false);
                setSelectedProduct(null);
              }}
              productTitle={selectedProduct.title}
              onSubmit={handleReject}
            />
          )}
          {/* Only render UpdateProductModal and DeleteConfirmModal for published products */}
          {activeTab === 'published' && (
            <>
              <UpdateProductModal
                isOpen={updateModalOpen}
                onClose={() => {
                  setUpdateModalOpen(false);
                  setSelectedProduct(null);
                }}
                product={selectedProduct}
                onSubmit={handleUpdate}
              />
              <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                  setDeleteModalOpen(false);
                  setSelectedProduct(null);
                }}
                title={selectedProduct.title}
                itemType="Product"
                onSubmit={handleDelete}
              />
            </>
          )}
        </>
      )}

      {/* --- CONTENT: INVITES TAB --- */}
      {activeTab === 'invites' && (
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-bold text-lg mb-4">Generate Invite Link</h2>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Role to Assign</label>
            <select 
              value={inviteRole} 
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="USER">User (Can Buy & Sell)</option>
              <option value="BUYER">Buyer Only (Can only view & buy)</option>
              <option value="SELLER">Seller Only (Can only submit products)</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {inviteRole === 'USER' && '✓ Full access: Can view marketplace and submit products'}
              {inviteRole === 'BUYER' && '👁️ View only: Can browse and buy, cannot sell'}
              {inviteRole === 'SELLER' && '📦 Sell only: Can submit products, cannot browse marketplace'}
              {inviteRole === 'ADMIN' && '⚡ Admin access: Full control + admin dashboard'}
            </p>
          </div>

          <button 
            onClick={generateInvite}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-6 hover:bg-blue-700 transition"
          >
            Generate Link
          </button>

          {generatedLink && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 animate-in fade-in slide-in-from-bottom-2">
              <label className="block text-xs text-green-800 font-bold mb-1">YOUR LINK:</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={generatedLink} 
                  className="flex-1 text-sm bg-white p-2 border rounded text-gray-600"
                />
                <button onClick={copyLink} className="p-2 bg-green-200 text-green-800 rounded hover:bg-green-300 transition">
                  <Copy size={18} />
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Send this to the new user. When they click it, the bot will authorize them.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
