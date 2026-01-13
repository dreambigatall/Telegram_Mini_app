# Frontend Integration Guide - Image Upload Feature

This guide explains how to integrate the new **direct image upload** functionality (up to 4 images) with your frontend.

## 📋 What Changed

### Before
- Users had to send images to the Telegram bot
- Copy the file ID
- Paste it in the form as `mediaFileId`

### Now
- Users can **directly upload images** in the app (up to 4 images)
- No need to use the Telegram bot
- Images are automatically uploaded to Telegram storage

---

## 🔄 API Changes

### 1. Submit Product (`POST /api/products`)

**Request Format:** `multipart/form-data` (not `application/json`)

**Fields:**
- `title` (string, required)
- `description` (string, optional)
- `originalPrice` (number, required)
- `madeIn` (string, optional)
- `expirationDate` (string, optional)
- `expirationDateRaw` (string, optional)
- `images` (files, optional) - **Up to 4 image files**

**Note:** `mediaFileId` is still supported for backward compatibility, but you can now use direct file uploads instead.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Product Name",
    "images": ["file_id_1", "file_id_2", "file_id_3"],
    "mediaFileId": "file_id_1", // First image (backward compatibility)
    // ... other fields
  }
}
```

### 2. Update Product (`PATCH /api/products/:id`)

**Request Format:** `multipart/form-data`

**Fields:** Same as submit, plus admin fields

**Response:** Updated product with `images` array

### 3. Get Product (`GET /api/products/:id`)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Product Name",
    "images": ["file_id_1", "file_id_2"], // Array of file IDs
    "mediaFileId": "file_id_1", // First image (backward compatibility)
    // ... other fields
  }
}
```

### 4. Get Feed (`GET /api/products/feed`)

**Response:** Each product includes `images` array

---

## 💻 Frontend Implementation

### Step 1: Update Form to Accept Files

```tsx
// Example: React with FormData
const handleSubmit = async (formData: FormData) => {
  // Add text fields
  formData.append('title', productData.title);
  formData.append('description', productData.description);
  formData.append('originalPrice', productData.originalPrice.toString());
  
  // Add optional fields
  if (productData.madeIn) {
    formData.append('madeIn', productData.madeIn);
  }
  if (productData.expirationDate) {
    formData.append('expirationDate', productData.expirationDate);
  }
  
  // Add image files (up to 4)
  selectedImages.forEach((file, index) => {
    formData.append('images', file); // Field name: 'images'
  });
  
  // Send request
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Authorization': initData, // Telegram initData
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData
  });
};
```

### Step 2: Image Selection Component

```tsx
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const MAX_IMAGES = 4;

const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  
  // Validate number of images
  if (selectedImages.length + files.length > MAX_IMAGES) {
    alert(`Maximum ${MAX_IMAGES} images allowed`);
    return;
  }
  
  // Validate file types
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const invalidFiles = files.filter(file => !validTypes.includes(file.type));
  
  if (invalidFiles.length > 0) {
    alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
    return;
  }
  
  // Validate file size (10MB max per image)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const oversizedFiles = files.filter(file => file.size > MAX_SIZE);
  
  if (oversizedFiles.length > 0) {
    alert('File size must be less than 10MB');
    return;
  }
  
  setSelectedImages([...selectedImages, ...files]);
};

const removeImage = (index: number) => {
  setSelectedImages(selectedImages.filter((_, i) => i !== index));
};
```

### Step 3: Display Images

```tsx
// Display uploaded images
{selectedImages.map((file, index) => (
  <div key={index}>
    <img 
      src={URL.createObjectURL(file)} 
      alt={`Preview ${index + 1}`}
      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
    />
    <button onClick={() => removeImage(index)}>Remove</button>
  </div>
))}

// Display images from API response
{product.images && product.images.map((fileId, index) => (
  <img 
    key={index}
    src={`/api/products/image/${fileId}`}
    alt={`Product image ${index + 1}`}
  />
))}
```

### Step 4: Update API Client

```typescript
// Update your API client to handle FormData
export const submitProduct = async (data: {
  title: string;
  description?: string;
  originalPrice: number;
  madeIn?: string;
  expirationDate?: string;
  expirationDateRaw?: string;
  images?: File[];
}) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', data.title);
  formData.append('originalPrice', data.originalPrice.toString());
  
  if (data.description) {
    formData.append('description', data.description);
  }
  if (data.madeIn) {
    formData.append('madeIn', data.madeIn);
  }
  if (data.expirationDate) {
    formData.append('expirationDate', data.expirationDate);
  }
  if (data.expirationDateRaw) {
    formData.append('expirationDateRaw', data.expirationDateRaw);
  }
  
  // Add image files
  if (data.images && data.images.length > 0) {
    data.images.forEach((file) => {
      formData.append('images', file);
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Authorization': WebApp.initData, // Telegram initData
    },
    body: formData
  });
  
  return response.json();
};
```

---

## 🎨 UI Example

```tsx
<div>
  <label>Product Images (up to 4)</label>
  <input
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
    multiple
    onChange={handleImageSelect}
    disabled={selectedImages.length >= MAX_IMAGES}
  />
  <p>{selectedImages.length} / {MAX_IMAGES} images selected</p>
  
  {/* Image Preview Grid */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
    {selectedImages.map((file, index) => (
      <div key={index} style={{ position: 'relative' }}>
        <img 
          src={URL.createObjectURL(file)}
          alt={`Preview ${index + 1}`}
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
        />
        <button 
          onClick={() => removeImage(index)}
          style={{ position: 'absolute', top: '5px', right: '5px' }}
        >
          ✕
        </button>
      </div>
    ))}
  </div>
</div>
```

---

## 🔄 Backward Compatibility

The API still supports the old `mediaFileId` field:

- **Old way:** Send `mediaFileId` as a string (still works)
- **New way:** Send `images` as files (recommended)

**Response always includes both:**
- `images`: Array of file IDs (new format)
- `mediaFileId`: First image file ID (for backward compatibility)

**Frontend should:**
- Use `images` array when available
- Fall back to `mediaFileId` if `images` is empty
- Display all images from the `images` array

```typescript
// Helper function to get image URLs
const getProductImages = (product: Product): string[] => {
  if (product.images && product.images.length > 0) {
    return product.images.map(fileId => `${API_BASE_URL}/products/image/${fileId}`);
  }
  // Fallback to mediaFileId
  if (product.mediaFileId) {
    return [`${API_BASE_URL}/products/image/${product.mediaFileId}`];
  }
  return [];
};
```

---

## ✅ Validation Rules

### Client-Side (Frontend)
- **Max images:** 4
- **File types:** JPEG, JPG, PNG, WebP, GIF
- **Max file size:** 10MB per image
- **Required:** At least 1 image (or `mediaFileId`)

### Server-Side (Backend)
- Same validation rules apply
- Server will reject invalid files with error messages

---

## 🐛 Error Handling

```typescript
try {
  const response = await submitProduct(formData);
  
  if (!response.success) {
    // Handle validation errors
    if (response.errors) {
      console.error('Validation errors:', response.errors);
    }
  }
} catch (error) {
  if (error.message.includes('Maximum 4 images')) {
    alert('Maximum 4 images allowed');
  } else if (error.message.includes('Invalid file type')) {
    alert('Invalid file type. Only images are allowed');
  } else if (error.message.includes('exceeds maximum size')) {
    alert('File size must be less than 10MB');
  } else {
    alert('Failed to upload product');
  }
}
```

---

## 📝 TypeScript Types

```typescript
interface Product {
  _id: string;
  title: string;
  description?: string;
  originalPrice: number;
  images?: string[]; // Array of Telegram file IDs
  mediaFileId?: string; // First image (backward compatibility)
  // ... other fields
}

interface SubmitProductPayload {
  title: string;
  description?: string;
  originalPrice: number;
  madeIn?: string;
  expirationDate?: string;
  expirationDateRaw?: string;
  images?: File[]; // Files to upload
  mediaFileId?: string; // Legacy: still supported
}
```

---

## 🚀 Quick Start Checklist

- [ ] Update form to use `FormData` instead of JSON
- [ ] Add file input with `multiple` attribute
- [ ] Implement image preview
- [ ] Add image removal functionality
- [ ] Validate file count (max 4)
- [ ] Validate file types and sizes
- [ ] Update API client to send `multipart/form-data`
- [ ] Update product display to show `images` array
- [ ] Test with 1, 2, 3, and 4 images
- [ ] Test error cases (too many files, invalid types, etc.)

---

## 💡 Tips

1. **Image Preview:** Use `URL.createObjectURL()` for previews, remember to revoke with `URL.revokeObjectURL()` when done
2. **Progress Indicator:** Show upload progress for better UX
3. **Image Order:** The order of images in the array matches upload order
4. **Caching:** Image URLs from Telegram are cached, so they load fast
5. **Fallback:** Always handle both `images` array and `mediaFileId` for compatibility

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify `Content-Type` is not manually set (let browser set it)
3. Ensure `Authorization` header includes Telegram `initData`
4. Check server logs for validation errors

