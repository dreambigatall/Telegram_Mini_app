import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Camera, DollarSign, Type, FileText, Globe, Calendar, AlertCircle } from 'lucide-react';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const SellPage = () => {
  const navigate = useNavigate();
  const { canSubmitProducts, isBuyer, isLoading } = useAuth();
  
  // 1. Form State - includes new fields
  const [formData, setFormData] = useState({
    title: '',
    originalPrice: '',
    description: '',
    mediaFileId: '',
    madeIn: '',           // NEW: Country/location
    expirationDate: ''    // NEW: Flexible date format
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2. Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate price
    const price = Number(formData.originalPrice);
    if (price <= 0) {
      setError('Price must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      // Prepare payload - only include non-empty optional fields
      const payload: Record<string, any> = {
        title: formData.title,
        originalPrice: price,
      };

      // Add optional fields if they have values
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.mediaFileId.trim()) {
        payload.mediaFileId = formData.mediaFileId.trim();
      }
      if (formData.madeIn.trim()) {
        payload.madeIn = formData.madeIn.trim();
      }
      if (formData.expirationDate.trim()) {
        payload.expirationDate = formData.expirationDate.trim();
      }

      await api.post('/products', payload);

      // Success! Show toast and redirect to Feed (or stay if SELLER)
      showToast('✅ Item submitted! Waiting for Admin approval.', 'success');
      
      // SELLER can only sell, so stay on this page and clear form
      if (isBuyer === false && canSubmitProducts) {
        setFormData({
          title: '',
          originalPrice: '',
          description: '',
          mediaFileId: '',
          madeIn: '',
          expirationDate: ''
        });
      } else {
        navigate('/');
      }
      
    } catch (err: any) {
      console.error(err);
      
      // Handle specific error for BUYER role
      if (err.response?.status === 403) {
        setError('You do not have permission to submit products.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit item.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Access Denied for BUYER role
  if (!canSubmitProducts) {
    return (
      <div className="p-4 pb-24">
        <div className="bg-amber-50 text-amber-800 p-6 rounded-xl border border-amber-200 text-center">
          <AlertCircle size={48} className="mx-auto mb-3 text-amber-500" />
          <h2 className="font-bold text-lg mb-2">Access Restricted</h2>
          <p className="text-sm">
            Your account is set up for buying only. 
            You cannot submit products for sale.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            Go to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Sell an Item</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Type className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. iPhone 15 Pro"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.title}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="number"
              name="originalPrice"
              required
              min="0.01"
              step="0.01"
              placeholder="1200"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.originalPrice}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea
              name="description"
              rows={3}
              placeholder="Condition, color, battery health..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.description}
              onChange={handleChange}
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
              name="madeIn"
              maxLength={100}
              placeholder="e.g. USA, Japan, Germany"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.madeIn}
              onChange={handleChange}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Optional • Max 100 characters</p>
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
              name="expirationDate"
              placeholder="e.g. 2026, Nov/2026, 2026/01/15"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={formData.expirationDate}
              onChange={handleChange}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Optional • Formats: YYYY, YYYY/MM, Month/YYYY, YYYY/MM/DD
          </p>
        </div>

        {/* Image Code Input */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Add Photo (Optional)
          </label>
          <p className="text-xs text-blue-600 mb-2">
            1. Send your photo to this Bot in the chat.<br/>
            2. Copy the code it replies with.<br/>
            3. Paste it below.
          </p>
          <div className="relative">
            <Camera className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              name="mediaFileId"
              placeholder="Paste code here (AgAC...)"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={formData.mediaFileId}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Submitting...
            </span>
          ) : (
            'Submit for Review'
          )}
        </button>

      </form>
    </div>
  );
};

export default SellPage;
