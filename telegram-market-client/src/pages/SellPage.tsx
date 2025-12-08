import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { 
  DollarSign, Type, FileText, Globe, Calendar, AlertCircle, Loader2, 
  ArrowLeft, Plus, X, Check, Image as ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { ImageUploader } from '../components/ImageUploader';
import { ProgressBar } from '../components/ProgressBar';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://route-betty-sol-disk.trycloudflare.com/api';

// Welcome illustration URL
const WELCOME_ILLUSTRATION_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtLJhxi-DZzaowzRBpbUM3G4GBHQoh1CwPkBMmbH2SUQaZqMpacCh3qZ1Y5FPsvPT4sZ-n4s7b0PPKmRR8Ks8jimNEM1H5aCWv4l3l094mtY5JJ3wzL7doON1zWYUd4QL6AHS6mDG-kVPHHUHzlZwzI0rASXdd8YbnSihe-41LJJ9I5MtgDQfjZ_AmMSfqbXj-DFVK5OiQzxMOqnBF28NjSlButL3W0lry_1NOtuZGqqsKLfzC6S-2XZ7TuvxUtK9eEVi8OcIiwpk';

const TOTAL_STEPS = 3;

const SellPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canSubmitProducts, isBuyer, isSeller, isLoading } = useAuth();
  
  // Welcome screen state - determined by URL
  const showWelcome = location.pathname === '/sell';
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State (persists across steps)
  const [formData, setFormData] = useState({
    title: '',
    originalPrice: '',
    description: '',
    madeIn: '',
    expirationDate: ''
  });
  
  // Image State
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // For Step 3 carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Active Image for Step 2 Preview
  const [activeImage, setActiveImage] = useState<File | null>(null);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  // Generate preview URL for active image
  useEffect(() => {
    if (activeImage) {
      const url = URL.createObjectURL(activeImage);
      setActiveImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setActiveImagePreview(null);
    }
  }, [activeImage]);

  // Validation state
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate Step 1 (Enter Details)
  useEffect(() => {
    const titleValid = formData.title.trim().length >= 3;
    const priceValid = Number(formData.originalPrice) > 0;
    setIsStep1Valid(titleValid && priceValid);
  }, [formData.title, formData.originalPrice]);

  // Validate Step 2 (Upload Image)
  useEffect(() => {
    setIsStep2Valid(selectedImages.length >= 1 && selectedImages.length <= 4);
  }, [selectedImages.length]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Images Change
  const handleImagesChange = (images: File[]) => {
    // Determine if we added or removed images
    const isAdding = images.length > selectedImages.length;
    
    setSelectedImages(images);
    setImageError('');
    
    if (images.length === 0) {
      setActiveImage(null);
    } else {
      // If adding, select the new one (last one)
      if (isAdding) {
        setActiveImage(images[images.length - 1]);
      } 
      // If removing and active image is gone, select the last available one
      else if (activeImage && !images.includes(activeImage)) {
        setActiveImage(images[images.length - 1]);
      }
      // If we have images but no active image, select the last one
      else if (!activeImage) {
        setActiveImage(images[images.length - 1]);
      }
    }
  };

  // Handle click on grid image
  const handleImageGridClick = (file: File) => {
    setActiveImage(file);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      originalPrice: '',
      description: '',
      madeIn: '',
      expirationDate: ''
    });
    setSelectedImages([]);
    setActiveImage(null);
    setError('');
    setImageError('');
    setCurrentStep(1);
  };

  // Handle "Add Your Product" button - show form
  const handleStartSelling = () => {
    navigate('/sell/form');
    setCurrentStep(1);
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep === 1) {
      // Return to welcome screen
      resetForm();
      navigate('/sell');
    } else {
      // Go to previous step
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle close button
  const handleClose = () => {
    resetForm();
    navigate('/sell');
  };

  // Handle Next button
  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
    }
  };

  // Handle Submit (Step 3)
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setImageError('');

    // Validate price
    const price = Number(formData.originalPrice);
    if (price <= 0) {
      setError('Price must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      
      // Add required fields
      submitData.append('title', formData.title.trim());
      submitData.append('originalPrice', price.toString());
      
      // Add optional text fields
      if (formData.description.trim()) {
        submitData.append('description', formData.description.trim());
      }
      if (formData.madeIn.trim()) {
        submitData.append('madeIn', formData.madeIn.trim());
      }
      if (formData.expirationDate.trim()) {
        submitData.append('expirationDate', formData.expirationDate.trim());
      }
      
      // Add image files
      selectedImages.forEach((file) => {
        submitData.append('images', file);
      });

      // Send request with FormData
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': WebApp.initData || '',
        },
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to submit product');
      }

      // Success!
      showToast('✅ Item submitted! Waiting for Admin approval.', 'success');
      
      // SELLER stays on page and resets to welcome, others navigate to feed
      if (isSeller) {
        resetForm();
        navigate('/sell'); // Return to welcome screen
      } else {
        navigate('/');
      }
      
    } catch (err: any) {
      console.error('Submit error:', err);
      
      if (err.message?.includes('Maximum 4 images')) {
        setImageError('Maximum 4 images allowed');
      } else if (err.message?.includes('Invalid file type')) {
        setImageError('Invalid file type. Only images are allowed');
      } else if (err.message?.includes('exceeds maximum size')) {
        setImageError('File size must be less than 10MB');
      } else {
        setError(err.message || 'Failed to submit item. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Sell Item';
      case 2: return 'Sell an Item';
      case 3: return 'Review & Publish';
      default: return 'Sell Item';
    }
  };

  // Get preview image URLs for Step 3 (with cleanup)
  const previewUrlsRef = useRef<string[]>([]);
  
  useEffect(() => {
    // Cleanup old URLs
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    
    // Create new URLs
    previewUrlsRef.current = selectedImages.map(file => URL.createObjectURL(file));
    
    // Cleanup on unmount
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  const getPreviewImageUrls = (): string[] => {
    return previewUrlsRef.current;
  };

  // Reset image index when step changes
  useEffect(() => {
    if (currentStep === 3) {
      setCurrentImageIndex(0);
    }
  }, [currentStep]);

  // Handle carousel scroll
  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setCurrentImageIndex(index);
    }
  };

  // Scroll to specific image
  const scrollToImage = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * carouselRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handlePrevImage = () => {
    const newIndex = Math.max(0, currentImageIndex - 1);
    setCurrentImageIndex(newIndex);
    scrollToImage(newIndex);
  };

  const handleNextImage = () => {
    const newIndex = Math.min(selectedImages.length - 1, currentImageIndex + 1);
    setCurrentImageIndex(newIndex);
    scrollToImage(newIndex);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
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

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 pb-20">
        <main className="flex flex-col flex-grow items-center justify-center text-center px-4 py-6">
          {/* Illustration */}
          <div className="w-full max-w-xs mb-8">
            <img 
              alt="An illustration of a friendly character with a shopping cart, symbolizing e-commerce and selling." 
              className="w-48 h-48 mx-auto rounded-xl"
              src={WELCOME_ILLUSTRATION_URL}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome, Seller!
          </h1>

          {/* Description */}
          <p className="text-base text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
            Start selling your products in minutes. Reach thousands of customers right here in the messenger.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleStartSelling}
            className="w-full max-w-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              <Plus size={20} />
              Add Your Product
            </span>
          </button>
        </main>

        {/* Footer */}
        <footer className="text-center pb-6">
          <p className="text-sm text-gray-500">
            Powered by MerkatoBuilder
          </p>
        </footer>
      </div>
    );
  }

  // Multi-Step Form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
          disabled={loading}
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h1>
        <div className="w-10"></div> {/* Spacer to center title */}
      </header>

      {/* Progress Bar */}
      <div className="px-4 pt-4 bg-white">
        {currentStep === 1 && (
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Details</h2>
            <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>
        )}
        {currentStep === 2 && (
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Image</h2>
            <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>
        )}
        {currentStep === 3 && (
          <div className="mb-2">
            <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-grow p-6 pb-32">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Enter Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2" htmlFor="item-name">
                Item Name
              </label>
              <div className="relative">
                <Type className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  id="item-name"
                  name="title"
                  placeholder="e.g. iPhone 15 Pro"
                  className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2" htmlFor="price">
                Price ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="number"
                  id="price"
                  name="originalPrice"
                  min="0.01"
                  step="0.01"
                  placeholder="1200"
                  className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2" htmlFor="description">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Condition, color, battery health..."
                  className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2" htmlFor="madeIn">
                Made In / Country
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  id="madeIn"
                  name="madeIn"
                  maxLength={100}
                  placeholder="e.g. USA, Japan, Germany"
                  className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.madeIn}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2" htmlFor="expirationDate">
                Expiration Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  id="expirationDate"
                  name="expirationDate"
                  placeholder="e.g. 2026, Nov/2026, 2026/01/15"
                  className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Formats: YYYY, YYYY/MM, Month/YYYY, YYYY/MM/DD
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Upload Image */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2" htmlFor="image-upload">
                Item Photo
              </label>
              
              {/* Large Upload Area / Preview */}
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor={!activeImage ? "file-input-large" : undefined}
                  className={`relative flex flex-col items-center justify-center w-full h-48 border-2 rounded-xl transition-all overflow-hidden bg-gray-50 ${
                    activeImage ? 'border-blue-500 border-solid' : 'border-gray-300 border-dashed cursor-pointer hover:bg-gray-100'
                  }`}
                  onClick={(e) => {
                    if (activeImage) {
                      e.preventDefault(); // Don't trigger file input if showing preview
                      // Optional: maybe open a modal or just do nothing (it's a preview)
                    }
                  }}
                >
                  {activeImage && activeImagePreview ? (
                    <img 
                      src={activeImagePreview} 
                      alt="Active preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="text-4xl text-gray-400 mb-2" size={48} />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 10MB)</p>
                    </div>
                  )}
                  
                  <input
                    id="file-input-large"
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const newImages = [...selectedImages, ...files].slice(0, 4);
                        handleImagesChange(newImages);
                      }
                      e.target.value = ''; // Reset input
                    }}
                    disabled={loading}
                  />
                </label>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">Add one clear photo of the item.</p>
            </div>

            {/* Image Preview Grid */}
            <div className="mt-4">
              <ImageUploader
                images={selectedImages}
                onImagesChange={handleImagesChange}
                onImageClick={handleImageGridClick}
                error={imageError}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Step 3: Review & Publish */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Photo Carousel */}
            {selectedImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Photo</label>
                <div className="relative">
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-200">
                    <div 
                      ref={carouselRef}
                      className="flex overflow-x-scroll snap-x snap-mandatory h-full scrollbar-hide"
                      style={{ scrollSnapType: 'x mandatory' }}
                      onScroll={handleCarouselScroll}
                    >
                      {getPreviewImageUrls().map((url, index) => (
                        <div key={index} className="flex-shrink-0 w-full snap-center">
                          <img 
                            src={url} 
                            alt={`Product image ${index + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {selectedImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={handleNextImage}
                        disabled={currentImageIndex === selectedImages.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                  
                  {/* Image dots indicator */}
                  {selectedImages.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {selectedImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => scrollToImage(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Item Name</label>
              <div className="w-full p-4 rounded-xl bg-gray-200 text-gray-900">
                {formData.title || '—'}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Price</label>
              <div className="w-full p-4 rounded-xl bg-gray-200 text-gray-900">
                ${formData.originalPrice || '—'}
              </div>
            </div>

            {/* Description */}
            {formData.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                <div className="w-full p-4 rounded-xl bg-gray-200 text-gray-900">
                  <p className="leading-relaxed whitespace-pre-wrap">{formData.description}</p>
                </div>
              </div>
            )}

            {/* Made In */}
            {formData.madeIn && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Made In</label>
                <div className="w-full p-4 rounded-xl bg-gray-200 text-gray-900">
                  {formData.madeIn}
                </div>
              </div>
            )}

            {/* Expiration Date */}
            {formData.expirationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Expiration Date</label>
                <div className="w-full p-4 rounded-xl bg-gray-200 text-gray-900">
                  {formData.expirationDate}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Button - Fixed Position */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-200 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            disabled={loading || (currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
            className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </span>
            ) : (
              'Submit for Review'
            )}
          </button>
        )}
      </footer>
    </div>
  );
};

export default SellPage;
