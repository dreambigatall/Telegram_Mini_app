import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
    '2xl': 'max-w-2xl',
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
        <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: footer ? '5rem' : '1rem' }}>
          {children}
        </div>

        {/* Footer - Sticky at bottom */}
        {footer && (
          <div className="flex-shrink-0 sticky bottom-0 border-t border-gray-200 bg-white p-4 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

