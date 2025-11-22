import { AlertCircle, X, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ErrorDisplayProps {
  onDismiss?: () => void;
  className?: string;
}

/**
 * Error Display Component
 * Shows authentication errors from AuthContext to users
 */
export const ErrorDisplay = ({ onDismiss, className = '' }: ErrorDisplayProps) => {
  const { error, isLoading } = useAuth();

  // Don't show error while loading
  if (isLoading || !error) {
    return null;
  }

  // Determine error type and icon
  const isWarning = error.includes('invite') || error.includes('Access Denied');
  const isBanned = error.includes('banned');
  const isNetworkError = error.includes('Network error') || error.includes('connection');

  const getIcon = () => {
    if (isBanned) return <AlertCircle className="text-red-600" size={20} />;
    if (isWarning) return <AlertTriangle className="text-yellow-600" size={20} />;
    if (isNetworkError) return <Info className="text-blue-600" size={20} />;
    return <AlertCircle className="text-red-600" size={20} />;
  };

  const getBgColor = () => {
    if (isBanned) return 'bg-red-50 border-red-200';
    if (isWarning) return 'bg-yellow-50 border-yellow-200';
    if (isNetworkError) return 'bg-blue-50 border-blue-200';
    return 'bg-red-50 border-red-200';
  };

  const getTextColor = () => {
    if (isBanned) return 'text-red-800';
    if (isWarning) return 'text-yellow-800';
    if (isNetworkError) return 'text-blue-800';
    return 'text-red-800';
  };

  return (
    <div
      className={`${getBgColor()} ${getTextColor()} border rounded-lg p-4 mb-4 flex items-start gap-3 ${className}`}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      {/* Error Message */}
      <div className="flex-1">
        <p className="font-medium text-sm leading-relaxed">{error}</p>
        
        {/* Additional help text for specific errors */}
        {error.includes('invite') && (
          <p className="text-xs mt-2 opacity-80">
            Contact an admin to get an invite link to join this marketplace.
          </p>
        )}
        {isNetworkError && (
          <p className="text-xs mt-2 opacity-80">
            Please check your internet connection and try again.
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
          aria-label="Dismiss error"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

