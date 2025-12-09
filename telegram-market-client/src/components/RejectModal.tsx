import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { FileText, Loader2 } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  defaultReason?: string;
  onSubmit: (reason: string) => Promise<void>;
}

/**
 * Reject Modal
 * Used by admin to reject products with a reason
 */
export const RejectModal = ({
  isOpen,
  onClose,
  productTitle,
  defaultReason = 'Does not meet requirements.',
  onSubmit,
}: RejectModalProps) => {
  const [reason, setReason] = useState(defaultReason);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason(defaultReason);
      setError('');
    }
  }, [isOpen, defaultReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!reason.trim()) {
      setError('Please provide a rejection reason');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject item';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Reject Product" 
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
            form="reject-product-form"
            disabled={loading}
            className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Rejecting...
              </>
            ) : (
              'Reject Item'
            )}
          </button>
        </div>
      }
    >
      <form id="reject-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Product Title Display */}
        {productTitle && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Product to Reject</p>
            <p className="text-lg font-bold text-gray-900">{productTitle}</p>
          </div>
        )}

        {/* Rejection Reason Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Rejection Reason
          </label>
          <div className="relative group">
            <FileText className="absolute left-4 top-4 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20} />
            <textarea
              required
              rows={4}
              placeholder="Explain why this product is being rejected..."
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 focus:outline-none resize-none transition-all font-medium"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">This reason will be sent to the seller.</p>
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

