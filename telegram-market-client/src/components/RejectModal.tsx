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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject item');
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
            form="reject-product-form"
            disabled={loading}
            className="flex-1 bg-red-600 text-white font-medium py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Rejecting...
              </>
            ) : (
              'Reject Item'
            )}
          </button>
        </div>
      }
    >
      <form id="reject-product-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Product Title Display */}
        {productTitle && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 font-medium mb-1">Product</p>
            <p className="text-sm font-bold text-red-800">{productTitle}</p>
          </div>
        )}

        {/* Rejection Reason Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea
              required
              rows={4}
              placeholder="Enter reason for rejection..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              autoFocus
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

