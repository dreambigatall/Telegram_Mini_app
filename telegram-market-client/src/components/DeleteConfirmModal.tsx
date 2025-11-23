import { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // Item name (product title or user username)
  itemType?: string; // Type of item being deleted (e.g., "Product", "User")
  onSubmit: () => Promise<void>;
}

/**
 * Delete Confirmation Modal
 * Reusable modal for confirming deletions of products, users, etc.
 */
export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  title,
  itemType = 'item',
  onSubmit,
}: DeleteConfirmModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to delete ${itemType.toLowerCase()}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Delete ${itemType}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Message */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                Are you sure you want to delete this {itemType.toLowerCase()}?
              </p>
              <p className="text-sm text-red-700 font-bold break-words">
                "{title}"
              </p>
              <p className="text-xs text-red-600 mt-2">
                This action cannot be undone. The {itemType.toLowerCase()} will be removed from the system.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Deleting...
              </>
            ) : (
              `Delete ${itemType}`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

