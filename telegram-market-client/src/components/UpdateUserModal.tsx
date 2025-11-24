import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User as UserIcon, Shield, Ban, Loader2 } from 'lucide-react';
import { type User, type  UpdateUserPayload } from '../types';

interface UpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (id: string, data: UpdateUserPayload) => Promise<void>;
}

/**
 * Update User Modal
 * Used by Super Admin to update user details
 */
export const UpdateUserModal = ({
  isOpen,
  onClose,
  user,
  onSubmit,
}: UpdateUserModalProps) => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<User['role']>('USER');
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username || '');
      setFirstName(user.firstName || '');
      setRole(user.role || 'USER');
      setIsBanned(user.isBanned || false);
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      const updateData: UpdateUserPayload = {
        username: username.trim() || undefined,
        firstName: firstName.trim() || undefined,
        role,
        isBanned,
      };

      await onSubmit(user._id, updateData);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to update user';
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
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Update User" 
      size="md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="update-user-form"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </button>
        </div>
      }
    >
      <form id="update-user-form" onSubmit={handleSubmit} className="space-y-4">
        {/* User ID Display */}
        {user && (
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600">
              User ID: <span className="font-mono">{user._id}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Telegram ID: <span className="font-mono">{user.telegramId}</span>
            </p>
          </div>
        )}

        {/* Username Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username (Optional)
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              maxLength={50}
              placeholder="username"
              pattern="[a-zA-Z0-9_]+"
              title="Only letters, numbers, and underscores allowed"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        {/* First Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name (Optional)
          </label>
          <input
            type="text"
            maxLength={100}
            placeholder="John"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Role Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value as User['role'])}
              disabled={loading}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Is Banned Toggle */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              checked={isBanned}
              onChange={(e) => setIsBanned(e.target.checked)}
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <Ban size={18} className={isBanned ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-700">
                Ban User
              </span>
            </div>
          </label>
          {isBanned && (
            <p className="text-xs text-red-600 mt-2 ml-8">
              Banned users cannot access the marketplace.
            </p>
          )}
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

