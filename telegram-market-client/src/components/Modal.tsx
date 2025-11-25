import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

/**
 * Modal Component
 * Reusable modal dialog for forms and confirmations
 * Optimized for Telegram Mini App with sticky footer support
 */
export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[calc(100vh-80px)] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 id="modal-title" className="text-lg font-bold text-gray-800">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {children}
        </div>

        {/* Footer - Sticky */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

