import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DollarSign, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PriceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPrice: number;
  onSubmit: (finalPrice: number, adminUsername: string) => Promise<void>;
}

/**
 * Price Input Modal
 * Used by admin to set final price when approving products
 */
export const PriceInputModal = ({
  isOpen,
  onClose,
  originalPrice,
  onSubmit,
}: PriceInputModalProps) => {
  const { user } = useAuth();
  const [finalPrice, setFinalPrice] = useState((originalPrice || 0).toString());
  const [adminUsername, setAdminUsername] = useState(user?.username || user?.firstName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFinalPrice((originalPrice || 0).toString());
      setAdminUsername(user?.username || user?.firstName || '');
      setError('');
    }
  }, [isOpen, originalPrice, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const price = Number.parseFloat(finalPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price greater than 0');
      setLoading(false);
      return;
    }

    if (!adminUsername.trim()) {
      setError('Please enter your display username');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(price, adminUsername.trim());
      onClose();
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to approve item';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Approve Product" 
      size="md"
      footer={
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="approve-product-form"
            disabled={loading}
            className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Publishing...
              </>
            ) : (
              'Publish Item'
            )}
          </button>
        </div>
      }
    >
      <form id="approve-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Original Price Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Seller's Original Price</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight">${originalPrice}</p>
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
             <DollarSign size={24} />
          </div>
        </div>

        {/* Final Price Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Final Price ($)
          </label>
          <div className="relative group">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all text-lg font-medium"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Set the final selling price including fees.</p>
        </div>

        {/* Admin Username Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Admin Display Name
          </label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              required
              placeholder="e.g. SuperBroker"
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all font-medium"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">This name will be visible to buyers.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};

