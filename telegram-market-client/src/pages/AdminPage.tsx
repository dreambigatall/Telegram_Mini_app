import { useEffect, useState } from 'react';
import { Check, X, Copy, RefreshCw, UserPlus, Package, Edit, Trash2 } from 'lucide-react';
import api, { getImageUrl } from '../utils/api';
import { type Product, type UpdateProductPayload } from '../types';
import { PriceInputModal } from '../components/PriceInputModal';
import { RejectModal } from '../components/RejectModal';
import { UpdateProductModal } from '../components/UpdateProductModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { showToast } from '../components/Toast';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'published' | 'invites'>('products');
  
  // State for Products
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishedLoading, setPublishedLoading] = useState(false);
  
  // State for Invites
  const [generatedLink, setGeneratedLink] = useState('');
  const [inviteRole, setInviteRole] = useState('USER');

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- 1. FETCH PENDING ITEMS ---
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/pending');
      setPendingProducts(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load pending items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH PUBLISHED ITEMS ---
  const fetchPublished = async () => {
    setPublishedLoading(true);
    try {
      const res = await api.get('/products/feed');
      // Backend returns: { success: true, data: [...], pagination: {...} }
      let productsData: Product[] = [];
      if (res.data) {
        if (res.data.success && Array.isArray(res.data.data)) {
          productsData = res.data.data;
        } else if (Array.isArray(res.data.data)) {
          productsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        }
      }
      setPublishedProducts(productsData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load published items', 'error');
    } finally {
      setPublishedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchPending();
    } else if (activeTab === 'published') {
      fetchPublished();
    }
  }, [activeTab]);

  // --- 2. APPROVE LOGIC ---
  const handleApproveClick = (product: Product) => {
    setSelectedProduct(product);
    setApproveModalOpen(true);
  };

  const handleApprove = async (finalPrice: number, adminUsername: string) => {
    if (!selectedProduct) return;

    await api.patch(`/products/${selectedProduct._id}/approve`, {
      finalPrice,
      adminUsername,
      adminPhone: '' // Optional
    });
    
    showToast('✅ Item Published!', 'success');
    fetchPending(); // Refresh list
  };

  // --- 3. REJECT LOGIC ---
  const handleRejectClick = (product: Product) => {
    setSelectedProduct(product);
    setRejectModalOpen(true);
  };

  const handleReject = async (reason: string) => {
    if (!selectedProduct) return;

    await api.patch(`/products/${selectedProduct._id}/reject`, { reason });
    showToast('❌ Item Rejected', 'success');
    fetchPending();
  };

  // --- 4. GENERATE INVITE LOGIC ---
  const generateInvite = async () => {
    try {
      const res = await api.post('/admin/invite', { role: inviteRole });
      // Backend wraps response in { success, message, data: { link, ... } }
      setGeneratedLink(res.data.data?.link || res.data.link);
      showToast('Invite link generated!', 'success');
    } catch (err) {
      showToast('Failed to generate invite. Are you an Admin?', 'error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    showToast('Link copied to clipboard!', 'success', 2000);
  };

  // --- UPDATE PRODUCT LOGIC ---
  const handleUpdateClick = (product: Product) => {
    setSelectedProduct(product);
    setUpdateModalOpen(true);
  };

  const handleUpdate = async (id: string, data: UpdateProductPayload) => {
    try {
      await api.patch(`/products/${id}`, data);
      showToast('✅ Product updated successfully!', 'success');
      fetchPublished(); // Refresh published list
      setUpdateModalOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to update product';
      showToast(message, 'error');
      throw err; // Re-throw so modal can handle it
    }
  };

  // --- DELETE PRODUCT LOGIC ---
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await api.delete(`/products/${selectedProduct._id}`);
      showToast('✅ Product deleted successfully!', 'success');
      fetchPublished(); // Refresh published list
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to delete product';
      showToast(message, 'error');
      throw err; // Re-throw so modal can handle it
    }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* TABS */}
      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
        >
          <Package size={18} /> Review Items
        </button>
        <button 
          onClick={() => setActiveTab('published')}
          className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 ${activeTab === 'published' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
        >
          <Package size={18} /> Published
        </button>
        <button 
          onClick={() => setActiveTab('invites')}
          className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 ${activeTab === 'invites' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
        >
          <UserPlus size={18} /> Invites
        </button>
      </div>

      {/* --- CONTENT: PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-gray-700">Pending Approvals ({pendingProducts.length})</h2>
            <button onClick={fetchPending} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? <p>Loading...</p> : pendingProducts.length === 0 ? <p className="text-gray-400">No pending items.</p> : null}

          {pendingProducts.map(p => (
            <div key={p._id} className="bg-white p-4 rounded-xl shadow border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{p.title}</h3>
                <span className="text-blue-600 font-bold">${p.originalPrice}</span>
              </div>
              
              {/* Show Seller Info (Only visible to Admin) */}
              <p className="text-xs text-gray-400 mb-2">
                Seller: {p.seller?.username || p.seller?.firstName || 'Unknown'} (ID: {p.seller?._id || 'Hidden'})
              </p>
              
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">{p.description}</p>
              
              {/* Image Preview */}
              {p.mediaFileId && (
                <img 
                  src={getImageUrl(p.mediaFileId)} 
                  className="w-full h-32 object-cover rounded-lg mb-4"
                  alt="Preview"
                />
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => handleRejectClick(p)}
                  className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-red-200"
                >
                  <X size={18} /> Reject
                </button>
                <button 
                  onClick={() => handleApproveClick(p)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-green-700"
                >
                  <Check size={18} /> Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CONTENT: PUBLISHED TAB --- */}
      {activeTab === 'published' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-gray-700">Published Products ({publishedProducts.length})</h2>
            <button onClick={fetchPublished} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
              <RefreshCw size={16} />
            </button>
          </div>

          {publishedLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : publishedProducts.length === 0 ? (
            <p className="text-gray-400">No published items.</p>
          ) : null}

          {publishedProducts.map(p => (
            <div key={p._id} className="bg-white p-4 rounded-xl shadow border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{p.title}</h3>
                <span className="text-green-600 font-bold">${p.finalPrice || p.originalPrice}</span>
              </div>
              
              {/* Status Badge */}
              <div className="mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  p.status === 'SOLD' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {p.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">{p.description}</p>
              
              {/* Admin Contact Info */}
              {p.adminContact && (
                <p className="text-xs text-gray-400 mb-2">
                  Admin: @{p.adminContact.username} {p.adminContact.phoneNumber && `(${p.adminContact.phoneNumber})`}
                </p>
              )}
              
              {/* Image Preview */}
              {p.mediaFileId && (
                <img 
                  src={getImageUrl(p.mediaFileId)} 
                  className="w-full h-32 object-cover rounded-lg mb-4"
                  alt="Preview"
                />
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateClick(p)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700"
                >
                  <Edit size={18} /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteClick(p)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-red-700"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          ))}
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
              className="w-full p-2 border rounded-lg bg-gray-50"
            >
              <option value="USER">Buyer / Seller (Standard)</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <button 
            onClick={generateInvite}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-6 hover:bg-blue-700"
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
                <button onClick={copyLink} className="p-2 bg-green-200 text-green-800 rounded hover:bg-green-300">
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