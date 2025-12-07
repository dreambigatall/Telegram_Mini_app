import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Edit, DollarSign, User, Loader2, FileText, Globe, Calendar, Clock } from 'lucide-react';
import { type Product, type UpdateProductPayload, type AvailableTimeUnit } from '../types';
import { useAuth } from '../context/AuthContext';

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (id: string, data: UpdateProductPayload) => Promise<void>;
}

/**
 * Update Product Modal
 * Used by admin to update published products
 * Includes new fields: madeIn, expirationDate, availableTimeValue, availableTimeUnit
 */
export const UpdateProductModal = ({
  isOpen,
  onClose,
  product,
  onSubmit,
}: UpdateProductModalProps) => {
  const { user } = useAuth();
  
  // Basic product fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [status, setStatus] = useState<Product['status']>('PUBLISHED');
  
  // NEW: Product info fields
  const [madeIn, setMadeIn] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // NEW: Admin-only availability fields
  const [availableTimeValue, setAvailableTimeValue] = useState('');
  const [availableTimeUnit, setAvailableTimeUnit] = useState<AvailableTimeUnit | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setTitle(product.title || '');
      setDescription(product.description || '');
      setFinalPrice(product.finalPrice?.toString() || product.originalPrice?.toString() || '');
      setAdminUsername(product.adminContact?.username || user?.username || user?.firstName || '');
      setAdminPhone(product.adminContact?.phoneNumber || '');
      setStatus(product.status || 'PUBLISHED');
      
      // NEW: Set new field values
      setMadeIn(product.madeIn || '');
      setExpirationDate(product.expirationDateRaw || ''); // Use raw format for editing
      setAvailableTimeValue(product.availableTimeValue?.toString() || '');
      setAvailableTimeUnit(product.availableTimeUnit || '');
      
      setError('');
    }
  }, [isOpen, product, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!product) {
      setError('Product not found');
      setLoading(false);
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      setLoading(false);
      return;
    }

    const price = Number.parseFloat(finalPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price greater than 0');
      setLoading(false);
      return;
    }

    if (!adminUsername.trim()) {
      setError('Please enter admin display username');
      setLoading(false);
      return;
    }

    // Validate availableTimeValue if provided
    const timeValue = availableTimeValue ? parseInt(availableTimeValue) : null;
    if (timeValue !== null && (isNaN(timeValue) || timeValue < 1 || timeValue > 1000)) {
      setError('Available time value must be between 1 and 1000');
      setLoading(false);
      return;
    }

    try {
      const updateData: UpdateProductPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        finalPrice: price,
        adminContact: {
          username: adminUsername.trim(),
          phoneNumber: adminPhone.trim() || undefined,
        },
        status,
        // NEW: Include new fields
        madeIn: madeIn.trim() || undefined,
        expirationDate: expirationDate.trim() || undefined,
        availableTimeValue: timeValue,
        // If value is provided but no unit, backend defaults to 'day'
        availableTimeUnit: timeValue && availableTimeUnit ? availableTimeUnit : (timeValue ? 'day' : null),
      };

      await onSubmit(product._id, updateData);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to update product';
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

  // Clear available time fields
  const handleClearAvailableTime = () => {
    setAvailableTimeValue('');
    setAvailableTimeUnit('');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Update Product" 
      size="lg"
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
            form="update-product-form"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              <>
                <Edit size={18} />
                Update Product
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="update-product-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Product ID Display */}
        {product && (
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600">
              Product ID: <span className="font-mono">{product._id}</span>
            </p>
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={200}
            placeholder="Product title"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Product description..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Final Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Final Price ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Enter price"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* NEW: Made In / Country Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Made In / Country
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              maxLength={100}
              placeholder="e.g. USA, Japan, Germany"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={madeIn}
              onChange={(e) => setMadeIn(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* NEW: Expiration Date Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="e.g. 2026, Nov/2026, 2026/01/15"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Formats: YYYY, YYYY/MM, Month/YYYY, YYYY/MM/DD
          </p>
        </div>

        {/* NEW: Available Time Section (Admin Only) */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-purple-800">
              <Clock size={16} />
              Available Time (Admin Only)
            </label>
            {(availableTimeValue || availableTimeUnit) && (
              <button
                type="button"
                onClick={handleClearAvailableTime}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="1"
                max="1000"
                placeholder="e.g. 3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                value={availableTimeValue}
                onChange={(e) => setAvailableTimeValue(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-purple-600 mt-1">Value (1-1000)</p>
            </div>
            <div>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                value={availableTimeUnit}
                onChange={(e) => setAvailableTimeUnit(e.target.value as AvailableTimeUnit | '')}
                disabled={loading}
              >
                <option value="">Select unit (defaults to day)</option>
                <option value="hour">Hour(s)</option>
                <option value="day">Day(s)</option>
                <option value="weeks">Week(s)</option>
                <option value="month">Month(s)</option>
              </select>
              <p className="text-xs text-purple-600 mt-1">Time unit</p>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            ℹ️ If only number is entered, it defaults to "days"
          </p>
        </div>

        {/* Admin Contact Section */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Username <span className="text-red-500">*</span>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Phone (Optional)
            </label>
            <input
              type="tel"
              placeholder="+1234567890"
              maxLength={20}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Status Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value as Product['status'])}
            disabled={loading}
          >
            <option value="PUBLISHED">Published</option>
            <option value="SOLD">Sold</option>
            <option value="PENDING">Pending</option>
          </select>
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
