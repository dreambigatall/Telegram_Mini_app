import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // The bridge we made in Day 1
import { Camera, DollarSign, Type, FileText } from 'lucide-react';
import { showToast } from '../components/Toast';

const SellPage = () => {
  const navigate = useNavigate();
  
  // 1. Form State
  const [formData, setFormData] = useState({
    title: '',
    originalPrice: '',
    description: '',
    mediaFileId: ''
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

    try {
      // Send data to Backend
      // Note: originalPrice must be a number
      await api.post('/products', {
        ...formData,
        originalPrice: Number(formData.originalPrice)
      });

      // Success! Show toast and redirect to Feed
      showToast('✅ Item submitted! Waiting for Admin approval.', 'success');
      navigate('/');
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Sell an Item</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="number"
              name="originalPrice"
              required
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

        {/* Image Code Input (The Workflow you asked about) */}
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
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>

      </form>
    </div>
  );
};

export default SellPage;