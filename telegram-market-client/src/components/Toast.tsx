import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

/**
 * Toast Notification Component
 * Shows temporary notification messages
 */
export const ToastNotification = ({ toast, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'error':
        return <XCircle className="text-red-600" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={20} />;
      case 'info':
        return <Info className="text-blue-600" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`${getBgColor()} ${getTextColor()} border rounded-lg p-4 mb-3 shadow-lg flex items-start gap-3 min-w-[300px] max-w-md transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      {/* Message */}
      <div className="flex-1">
        <p className="font-medium text-sm leading-relaxed">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};

/**
 * Toast Container Component
 * Manages multiple toast notifications
 */
export const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const newToast: Toast = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...event.detail,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('showToast' as any, handleToast as EventListener);

    return () => {
      window.removeEventListener('showToast' as any, handleToast as EventListener);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
};

/**
 * Helper function to show toast notifications
 */
export const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
  const event = new CustomEvent('showToast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
};

