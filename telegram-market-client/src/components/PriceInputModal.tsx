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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve item');
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
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="approve-product-form"
            disabled={loading}
            className="flex-1 bg-green-600 text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Publishing...
              </>
            ) : (
              'Publish Item'
            )}
          </button>
        </div>
      }
    >
      <form id="approve-product-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Original Price Display */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-1">Original Price</p>
          <p className="text-lg font-bold text-blue-800">${originalPrice}</p>
        </div>

        {/* Final Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Final Price ($)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Enter final price"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        {/* Admin Username Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Display Username (without @)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              required
              placeholder="SuperBroker"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              disabled={loading}
            />
          </div>
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

