import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DollarSign, Loader2, FileText, Globe, Calendar, Clock, ArrowLeft, ArrowRight, ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { type Product, type UpdateProductPayload, type AvailableTimeUnit, getProductImageIds } from '../types';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/api';
import { ImageUploader } from './ImageUploader';
import { ProgressBar } from './ProgressBar';

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (id: string, data: UpdateProductPayload, newImages?: File[]) => Promise<void>;
}

/**
 * Update Product Modal (Progressive Multi-Step Style)
 * Step 1: Details & Settings
 * Step 2: Media Management
 * Step 3: Review & Update
 */
export const UpdateProductModal = ({
  isOpen,
  onClose,
  product,
  onSubmit,
}: UpdateProductModalProps) => {
  const { user } = useAuth();
  
  // Steps Control
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Basic product fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [status, setStatus] = useState<Product['status']>('PUBLISHED');
  
  // Product info fields
  const [madeIn, setMadeIn] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // Admin-only availability fields
  const [availableTimeValue, setAvailableTimeValue] = useState('');
  const [availableTimeUnit, setAvailableTimeUnit] = useState<AvailableTimeUnit | ''>('');
  
  // Image fields
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setCurrentStep(1);
      setTitle(product.title || '');
      setDescription(product.description || '');
      setFinalPrice(product.finalPrice?.toString() || product.originalPrice?.toString() || '');
      setAdminUsername(product.adminContact?.username || user?.username || user?.firstName || '');
      setAdminPhone(product.adminContact?.phoneNumber || '');
      setStatus(product.status || 'PUBLISHED');
      
      // Set product info fields
      setMadeIn(product.madeIn || '');
      setExpirationDate(product.expirationDateRaw || '');
      setAvailableTimeValue(product.availableTimeValue?.toString() || '');
      setAvailableTimeUnit(product.availableTimeUnit || '');
      
      // Set existing images
      const images = getProductImageIds(product);
      setExistingImages(images);
      setNewImages([]);
      
      // Set initial preview to first image if exists
      if (images.length > 0) {
        setActiveImagePreview(getImageUrl(images[0]));
      } else {
        setActiveImagePreview(null);
      }
      
      setError('');
      setImageError('');
    }
  }, [isOpen, product, user]);

  const validateStep1 = () => {
    if (!title.trim() || title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }
    const price = Number.parseFloat(finalPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price greater than 0');
      return false;
    }
    if (!adminUsername.trim()) {
      setError('Please enter admin display username');
      return false;
    }
    // Validate availableTimeValue if provided
    const timeValue = availableTimeValue ? parseInt(availableTimeValue) : null;
    if (timeValue !== null && (isNaN(timeValue) || timeValue < 1 || timeValue > 1000)) {
      setError('Available time value must be between 1 and 1000');
      return false;
    }

    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setError('');
    setImageError('');
    setLoading(true);

    if (!product) return;

    try {
      const timeValue = availableTimeValue ? parseInt(availableTimeValue) : null;
      const updateData: UpdateProductPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        finalPrice: Number.parseFloat(finalPrice),
        adminContact: {
          username: adminUsername.trim(),
          phoneNumber: adminPhone.trim() || undefined,
        },
        status,
        madeIn: madeIn.trim() || undefined,
        expirationDate: expirationDate.trim() || undefined,
        availableTimeValue: timeValue,
        availableTimeUnit: timeValue && availableTimeUnit ? availableTimeUnit : (timeValue ? 'day' : null),
      };

      await onSubmit(product._id, updateData, newImages.length > 0 ? newImages : undefined);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      const errorMessage = errorObj?.response?.data?.error 
        || errorObj?.response?.data?.message 
        || errorObj?.message 
        || 'Failed to update product';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setImageError('');
      onClose();
    }
  };

  // Clear available time fields
  const handleClearAvailableTime = () => {
    setAvailableTimeValue('');
    setAvailableTimeUnit('');
  };

  // Handle new images change
  const handleNewImagesChange = (images: File[]) => {
    const totalAllowed = 4 - existingImages.length;
    if (images.length > totalAllowed) {
      setImageError(`You can only add ${totalAllowed} more image(s)`);
      return;
    }
    setNewImages(images);
    
    // Auto-preview the last added image
    if (images.length > 0) {
      const lastImage = images[images.length - 1];
      setActiveImagePreview(URL.createObjectURL(lastImage));
    }
    setImageError('');
  };

  // Handle image click for preview
  const handleImageClick = (source: string | File) => {
    if (source instanceof File) {
      setActiveImagePreview(URL.createObjectURL(source));
    } else {
      setActiveImagePreview(getImageUrl(source));
    }
  };

  const maxNewImages = Math.max(0, 4 - existingImages.length);

  // --- RENDER STEPS ---

  const renderStep1 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Product ID</p>
        <p className="font-mono text-sm text-gray-700">{product?._id}</p>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder="Product title"
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Description
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="Product description..."
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Final Price Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Final Price ($) <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Enter price"
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium text-lg"
            value={finalPrice}
            onChange={(e) => setFinalPrice(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Made In */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Made In</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              maxLength={100}
              placeholder="Country"
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              value={madeIn}
              onChange={(e) => setMadeIn(e.target.value)}
            />
          </div>
        </div>
        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Date"
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Admin Settings Accordion/Group */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Admin Settings</h4>
        
        {/* Available Time */}
        <div className="bg-white p-3 rounded-lg border border-purple-100 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-purple-800">
              <Clock size={16} />
              Availability Timer
            </label>
            {(availableTimeValue || availableTimeUnit) && (
              <button
                type="button"
                onClick={handleClearAvailableTime}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              min="1"
              max="1000"
              placeholder="Qty"
              className="col-span-1 px-3 py-2 border rounded-md focus:ring-1 focus:ring-purple-500 text-sm"
              value={availableTimeValue}
              onChange={(e) => setAvailableTimeValue(e.target.value)}
            />
            <select
              className="col-span-2 px-3 py-2 border rounded-md focus:ring-1 focus:ring-purple-500 text-sm bg-white"
              value={availableTimeUnit}
              onChange={(e) => setAvailableTimeUnit(e.target.value as AvailableTimeUnit | '')}
            >
              <option value="">Unit (Default: Days)</option>
              <option value="hour">Hour(s)</option>
              <option value="day">Day(s)</option>
              <option value="weeks">Week(s)</option>
              <option value="month">Month(s)</option>
            </select>
          </div>
        </div>

        {/* Contact & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display User *</label>
            <input
              type="text"
              required
              placeholder="e.g. Admin"
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm bg-white"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as Product['status'])}
            >
              <option value="PUBLISHED">Published</option>
              <option value="SOLD">Sold</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Large Preview Area */}
      <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group shadow-inner">
        {activeImagePreview ? (
          <img 
            src={activeImagePreview} 
            alt="Preview" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={48} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Select an image to preview</p>
          </div>
        )}
      </div>

      {/* Existing Images Grid */}
      {existingImages.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Current Images ({existingImages.length})
          </label>
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((fileId, index) => (
              <div 
                key={fileId} 
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  activeImagePreview === getImageUrl(fileId) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleImageClick(fileId)}
              >
                <img
                  src={getImageUrl(fileId)}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Uploads */}
      {maxNewImages > 0 ? (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <ImageUploader
            images={newImages}
            onImagesChange={handleNewImagesChange}
            onImageClick={(file) => handleImageClick(file)}
            maxImages={maxNewImages}
            error={imageError}
            disabled={loading}
          />
          <p className="text-xs text-green-700 mt-2 font-medium">
            You can add up to {maxNewImages} more image{maxNewImages !== 1 && 's'}.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>Maximum image limit reached (4/4).</span>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
        <h3 className="text-lg font-bold text-gray-800">Ready to Update?</h3>
        <p className="text-sm text-gray-500">Review your changes before publishing.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header Image */}
        <div className="h-32 bg-gray-100 w-full relative">
           {activeImagePreview ? (
             <img src={activeImagePreview} className="w-full h-full object-cover" alt="Cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400">
               <ImageIcon size={24} />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <div className="absolute bottom-3 left-3 text-white">
             <h4 className="font-bold text-lg truncate w-64">{title}</h4>
             <p className="text-sm opacity-90">${finalPrice}</p>
           </div>
        </div>

        {/* Details List */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm py-1 border-b border-gray-50">
             <span className="text-gray-500">Status</span>
             <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
               status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
               status === 'SOLD' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
             }`}>{status}</span>
          </div>
          <div className="flex justify-between text-sm py-1 border-b border-gray-50">
             <span className="text-gray-500">Admin Contact</span>
             <span className="font-medium text-gray-900">{adminUsername}</span>
          </div>
          {availableTimeValue && (
            <div className="flex justify-between text-sm py-1 border-b border-gray-50">
               <span className="text-gray-500">Timer</span>
               <span className="font-medium text-purple-600">{availableTimeValue} {availableTimeUnit || 'days'}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1">
             <span className="text-gray-500">New Images</span>
             <span className="font-medium text-green-600">+{newImages.length} selected</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={
        <div className="flex flex-col w-full pr-8">
           <span className="text-lg">Update Product</span>
           <div className="mt-2 w-full max-w-[200px]">
             <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
           </div>
        </div>
      }
      size="2xl"
      footer={
        <div className="flex gap-3 pt-2">
          {currentStep === 1 ? (
             <button
               type="button"
               onClick={handleClose}
               disabled={loading}
               className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
             >
               Cancel
             </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirm Update
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <form id="update-product-form" onSubmit={(e) => e.preventDefault()} className="pb-2">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
             <AlertCircle size={16} />
             {error}
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </form>
    </Modal>
  );
};
