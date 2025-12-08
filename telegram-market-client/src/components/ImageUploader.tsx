import { useRef, useEffect } from 'react';
import { Camera, X, Plus, AlertCircle } from 'lucide-react';
import { IMAGE_UPLOAD_CONFIG, validateImageFile } from '../types';

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  onImageClick?: (file: File, index: number) => void;
  maxImages?: number;
  error?: string;
  disabled?: boolean;
}

/**
 * ImageUploader Component
 * Allows users to select, preview, and remove up to 4 images
 */
export const ImageUploader = ({
  images,
  onImagesChange,
  onImageClick,
  maxImages = IMAGE_UPLOAD_CONFIG.MAX_IMAGES,
  error,
  disabled = false,
}: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  // Clean up object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Create preview URLs for images
  const getPreviewUrl = (file: File, index: number): string => {
    // Reuse existing URL if available
    if (!previewUrlsRef.current[index]) {
      previewUrlsRef.current[index] = URL.createObjectURL(file);
    }
    return previewUrlsRef.current[index];
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      // Clear old preview URLs for new images
      previewUrlsRef.current = previewUrlsRef.current.slice(0, images.length);
      onImagesChange([...images, ...validFiles]);
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    // Revoke the URL for the removed image
    if (previewUrlsRef.current[index]) {
      URL.revokeObjectURL(previewUrlsRef.current[index]);
    }
    
    // Remove from preview URLs array
    previewUrlsRef.current = previewUrlsRef.current.filter((_, i) => i !== index);
    
    // Remove from images array
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // Trigger file input click
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Camera size={18} className="text-gray-500" />
          Product Images
        </label>
        <span className="text-xs text-gray-500">
          {images.length} / {maxImages}
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Preview existing images */}
        {images.map((file, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => onImageClick?.(file, index)}
          >
            <img
              src={getPreviewUrl(file, index)}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Remove button */}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering onImageClick
                  handleRemoveImage(index);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition"
              >
                <X size={14} />
              </button>
            )}
            {/* Image number badge */}
            <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/60 text-white text-xs rounded-full flex items-center justify-center">
              {index + 1}
            </div>
          </div>
        ))}

        {/* Add button (if not at max) */}
        {canAddMore && (
          <button
            type="button"
            onClick={handleAddClick}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
          >
            <Plus size={24} className="text-gray-400" />
            <span className="text-xs text-gray-500">Add</span>
          </button>
        )}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxImages - images.length - (canAddMore ? 1 : 0)) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50"
          />
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Upload up to {maxImages} images. Supported: JPEG, PNG, WebP, GIF (max 10MB each)
      </p>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

