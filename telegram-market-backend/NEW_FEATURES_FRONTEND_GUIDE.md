# New Features - Frontend Integration Guide

This document explains all newly added features and how to integrate them in the frontend.

---

## 📦 Table of Contents

1. [New Product Fields](#new-product-fields)
   - [madeIn](#1-madein-field)
   - [expirationDate & expirationDateRaw](#2-expirationdate--expirationdateraw-fields)
   - [availableTimeValue & availableTimeUnit](#3-availabletimevalue--availabletimeunit-fields)
2. [New User Roles](#new-user-roles)
   - [SELLER Role](#seller-role)
   - [BUYER Role](#buyer-role)

---

## 📦 New Product Fields

### 1. `madeIn` Field

**Description:** Optional field for product manufacturing location/country.

**Type:** `string | null | undefined`

**Validation:**
- Maximum length: 100 characters
- Optional (can be null or omitted)
- Automatically trimmed

---

#### Frontend Integration

**Submit Product Form:**
```typescript
interface ProductFormData {
  title: string;
  description?: string;
  originalPrice: number;
  mediaFileId?: string;
  madeIn?: string; // NEW FIELD
  expirationDate?: string; // NEW FIELD
}

// Example form submission
const submitProduct = async (formData: ProductFormData) => {
  const response = await api.post('/products', {
    title: formData.title,
    description: formData.description,
    originalPrice: formData.originalPrice,
    mediaFileId: formData.mediaFileId,
    madeIn: formData.madeIn || null, // Optional field
    expirationDate: formData.expirationDate || null // Optional field
  });
  
  return response.data;
};
```

**Product Display:**
```typescript
interface Product {
  _id: string;
  title: string;
  description?: string;
  originalPrice: number;
  finalPrice?: number;
  madeIn?: string; // NEW FIELD - Display in product card
  expirationDate?: string; // ISO date string
  expirationDateRaw?: string; // Original format entered by user
  availableTimeValue?: number; // Admin-only field
  availableTimeUnit?: 'hour' | 'day' | 'weeks' | 'month'; // Admin-only field
  // ... other fields
}

// Display in UI
{product.madeIn && (
  <div className="product-info">
    <span className="label">Made in:</span>
    <span className="value">{product.madeIn}</span>
  </div>
)}
```

---

### 2. `expirationDate` & `expirationDateRaw` Fields

**Description:** 
- `expirationDate`: Parsed Date object (ISO string in API responses)
- `expirationDateRaw`: Original date string as entered by user

**Type:** 
- `expirationDate`: `Date | null | undefined` (stored as ISO string in DB)
- `expirationDateRaw`: `string | null | undefined`

**Validation:**
- Must be in the future if provided
- Supports multiple flexible date formats
- Optional (can be null or omitted)

---

#### Supported Date Formats

The backend accepts various date formats and automatically converts them:

| Input Format | Example | Stored As (expirationDate) | expirationDateRaw |
|-------------|---------|---------------------------|-------------------|
| Year only | `"2026"` | `2026-12-31T23:59:59.999Z` | `"2026"` |
| Year/Month | `"2026/02"` or `"2026-02"` | `2026-02-28T23:59:59.999Z` | `"2026/02"` |
| Year/Month (single digit) | `"2026/2"` | `2026-02-28T23:59:59.999Z` | `"2026/2"` |
| Full Date | `"2026/01/15"` or `"2026-01-15"` | `2026-01-15T00:00:00.000Z` | `"2026/01/15"` |
| Month Name/Year | `"Nov/2026"` or `"November/2026"` | `2026-11-30T23:59:59.999Z` | `"Nov/2026"` |
| Year/Month Name | `"2026/Nov"` or `"2026/November"` | `2026-11-30T23:59:59.999Z` | `"2026/Nov"` |
| ISO Date | `"2026-01-15T12:00:00Z"` | `2026-01-15T12:00:00.000Z` | `"2026-01-15T12:00:00Z"` |

**Supported Month Names:**
- Abbreviations: `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Sept`, `Oct`, `Nov`, `Dec`
- Full names: `January`, `February`, `March`, `April`, `June`, `July`, `August`, `September`, `October`, `November`, `December`
- Case-insensitive: `NOV`, `nov`, `Nov` all work

---

#### Frontend Integration

**Date Input Component:**
```typescript
// React component example
const ExpirationDateInput = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => {
  return (
    <div className="date-input">
      <label>Expiration Date (Optional)</label>
      <input
        type="text"
        placeholder="e.g., 2026, 2026/02, Nov/2026, 2026/01/15"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <small>
        Formats: YYYY, YYYY/MM, YYYY/MM/DD, Month/YYYY, or ISO date
      </small>
    </div>
  );
};
```

**Submit Product with Date:**
```typescript
const handleSubmit = async () => {
  const productData = {
    title: "Product Name",
    originalPrice: 100,
    madeIn: "USA",
    expirationDate: "2026/02" // User enters flexible format
  };
  
  const response = await api.post('/products', productData);
  
  // Response includes both parsed and raw date
  console.log(response.data.data.expirationDate); // "2026-02-28T23:59:59.999Z"
  console.log(response.data.data.expirationDateRaw); // "2026/02"
};
```

**Display Expiration Date:**
```typescript
// Display the original format entered by user (more user-friendly)
{product.expirationDateRaw && (
  <div className="expiration-date">
    <span className="label">Expires:</span>
    <span className="value">{product.expirationDateRaw}</span>
  </div>
)}

// OR display formatted date
{product.expirationDate && (
  <div className="expiration-date">
    <span className="label">Expires:</span>
    <span className="value">
      {new Date(product.expirationDate).toLocaleDateString()}
    </span>
  </div>
)}
```

**Date Validation (Frontend):**
```typescript
// Optional: Validate date format before submission
const validateExpirationDate = (dateString: string): boolean => {
  if (!dateString.trim()) return true; // Empty is valid (optional field)
  
  // Check if it matches supported formats
  const patterns = [
    /^\d{4}$/, // Year only
    /^\d{4}[\/\-]\d{1,2}$/, // Year/Month
    /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/, // Full date
    /^[A-Za-z]+[\/\-]\d{4}$/i, // Month/Year
    /^\d{4}[\/\-][A-Za-z]+$/i, // Year/Month name
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO date
  ];
  
  return patterns.some(pattern => pattern.test(dateString));
};
```

---

### 3. `availableTimeValue` & `availableTimeUnit` Fields

**Description:** 
- Admin-only fields set during product update
- Indicates how long the product is available (e.g., "3 days", "2 weeks")

**Type:**
- `availableTimeValue`: `number | null | undefined`
- `availableTimeUnit`: `'hour' | 'day' | 'weeks' | 'month' | null | undefined`

**Validation:**
- `availableTimeValue`: Positive integer, max 1000
- `availableTimeUnit`: Must be one of: `hour`, `day`, `weeks`, `month`
- **Special Behavior:** If only `availableTimeValue` is provided, `availableTimeUnit` defaults to `"day"`
- Both fields are optional
- Only admins can set these fields (during product update)

---

#### Frontend Integration (Admin Only)

**Admin Product Update Form:**
```typescript
interface AdminProductUpdate {
  title?: string;
  description?: string;
  finalPrice?: number;
  madeIn?: string;
  expirationDate?: string;
  availableTimeValue?: number; // NEW FIELD
  availableTimeUnit?: 'hour' | 'day' | 'weeks' | 'month'; // NEW FIELD
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED';
}

// Admin update component
const AdminProductUpdateForm = ({ productId }: { productId: string }) => {
  const [availableTimeValue, setAvailableTimeValue] = useState<number | null>(null);
  const [availableTimeUnit, setAvailableTimeUnit] = useState<'hour' | 'day' | 'weeks' | 'month' | null>(null);
  
  const handleUpdate = async () => {
    const updateData: AdminProductUpdate = {
      availableTimeValue: availableTimeValue || undefined,
      availableTimeUnit: availableTimeUnit || undefined
    };
    
    // If only value is provided, unit will default to "day" on backend
    if (availableTimeValue && !availableTimeUnit) {
      // Backend will automatically set unit to "day"
    }
    
    await api.patch(`/products/${productId}`, updateData);
  };
  
  return (
    <form onSubmit={handleUpdate}>
      <div className="available-time-input">
        <label>Available Time (Optional)</label>
        <div className="time-input-group">
          <input
            type="number"
            min="1"
            max="1000"
            placeholder="3"
            value={availableTimeValue || ''}
            onChange={(e) => setAvailableTimeValue(parseInt(e.target.value) || null)}
          />
          <select
            value={availableTimeUnit || ''}
            onChange={(e) => setAvailableTimeUnit(e.target.value as any || null)}
          >
            <option value="">Select unit (defaults to 'day')</option>
            <option value="hour">Hour(s)</option>
            <option value="day">Day(s)</option>
            <option value="weeks">Week(s)</option>
            <option value="month">Month(s)</option>
          </select>
        </div>
        <small>
          If only number is provided, it defaults to "day"
        </small>
      </div>
    </form>
  );
};
```

**Display Available Time:**
```typescript
// Display in product card (for buyers)
{product.availableTimeValue && product.availableTimeUnit && (
  <div className="available-time">
    <span className="label">Available for:</span>
    <span className="value">
      {product.availableTimeValue} {product.availableTimeUnit}
    </span>
  </div>
)}

// Example output: "Available for: 3 days"
```

**API Request Examples:**
```typescript
// Update with only value (defaults to "day")
await api.patch('/products/:id', {
  availableTimeValue: 3
  // availableTimeUnit will be set to "day" automatically
});

// Update with both value and unit
await api.patch('/products/:id', {
  availableTimeValue: 3,
  availableTimeUnit: 'weeks'
});

// Remove available time
await api.patch('/products/:id', {
  availableTimeValue: null,
  availableTimeUnit: null
});
```

---

## 👥 New User Roles

### SELLER Role

**Description:** Users who can only submit products (sell), but cannot view the product feed.

**Permissions:**
- ✅ Submit products (`POST /api/products`)
- ✅ View own profile (`GET /api/users/me`)
- ❌ View product feed (`GET /api/products/feed`) - **403 Forbidden**
- ❌ View product images (if auth required)
- ❌ Admin functions

---

#### Frontend Integration

**Role Check:**
```typescript
// Check if user can submit products
const canSubmitProducts = (userRole: string): boolean => {
  return ['SELLER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
};

// Check if user can view feed
const canViewFeed = (userRole: string): boolean => {
  return ['BUYER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
};

// Usage in components
const { user } = useAuth();

if (user?.role === 'SELLER') {
  // Show submit product form
  // Hide feed/marketplace view
}

if (!canViewFeed(user?.role || '')) {
  // Show message: "You don't have permission to view the marketplace"
  return <AccessDenied message="Sellers can only submit products, not view the marketplace" />;
}
```

**Conditional UI Rendering:**
```typescript
const App = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {canSubmitProducts(user?.role || '') && (
        <Route path="/submit" element={<SubmitProductPage />} />
      )}
      
      {canViewFeed(user?.role || '') && (
        <Route path="/marketplace" element={<MarketplacePage />} />
      )}
      
      {user?.role === 'SELLER' && (
        <Route path="/my-products" element={<MyProductsPage />} />
      )}
    </Routes>
  );
};
```

**Error Handling:**
```typescript
// Handle 403 errors for feed access
try {
  const response = await api.get('/products/feed');
  setProducts(response.data.data);
} catch (error: any) {
  if (error.response?.status === 403) {
    // User doesn't have permission (e.g., SELLER trying to view feed)
    setError('You do not have permission to view the marketplace');
  }
}
```

---

### BUYER Role

**Description:** Users who can only view the product feed (buy), but cannot submit products.

**Permissions:**
- ✅ View product feed (`GET /api/products/feed`)
- ✅ View product images (`GET /api/products/image/:fileId`)
- ✅ View own profile (`GET /api/users/me`)
- ❌ Submit products (`POST /api/products`) - **403 Forbidden**
- ❌ Admin functions

---

#### Frontend Integration

**Role Check:**
```typescript
// Check user permissions
const { user } = useAuth();

if (user?.role === 'BUYER') {
  // Show marketplace/feed
  // Hide submit product button/form
}

if (!canSubmitProducts(user?.role || '')) {
  // Show message: "You don't have permission to submit products"
  return <AccessDenied message="Buyers can only view products, not submit them" />;
}
```

**Conditional Navigation:**
```typescript
const Navigation = () => {
  const { user } = useAuth();
  
  return (
    <nav>
      {canViewFeed(user?.role || '') && (
        <Link to="/marketplace">Marketplace</Link>
      )}
      
      {canSubmitProducts(user?.role || '') && (
        <Link to="/submit">Sell Product</Link>
      )}
      
      {user?.role === 'BUYER' && (
        <span className="badge">Buyer Account</span>
      )}
    </nav>
  );
};
```

**Error Handling:**
```typescript
// Handle 403 errors for product submission
const handleSubmit = async (productData: ProductFormData) => {
  try {
    await api.post('/products', productData);
    // Success
  } catch (error: any) {
    if (error.response?.status === 403) {
      // User doesn't have permission (e.g., BUYER trying to submit)
      alert('You do not have permission to submit products. Your account is for buying only.');
    }
  }
};
```

---

## 📊 Complete Product Response Example

```typescript
interface ProductResponse {
  success: boolean;
  data: {
    _id: string;
    title: string;
    description?: string;
    originalPrice: number;
    finalPrice?: number;
    madeIn?: string; // NEW
    expirationDate?: string; // NEW - ISO date string
    expirationDateRaw?: string; // NEW - Original format
    availableTimeValue?: number; // NEW - Admin only
    availableTimeUnit?: 'hour' | 'day' | 'weeks' | 'month'; // NEW - Admin only
    adminContact?: {
      username: string;
      phoneNumber: string;
    };
    status: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED';
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}

// Example response
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Vintage Watch",
    "description": "Beautiful vintage watch in excellent condition",
    "originalPrice": 150,
    "finalPrice": 150,
    "madeIn": "Switzerland", // NEW FIELD
    "expirationDate": "2026-11-30T23:59:59.999Z", // NEW FIELD
    "expirationDateRaw": "Nov/2026", // NEW FIELD
    "availableTimeValue": 3, // NEW FIELD (Admin only)
    "availableTimeUnit": "weeks", // NEW FIELD (Admin only)
    "adminContact": {
      "username": "@admin",
      "phoneNumber": "+1234567890"
    },
    "status": "PUBLISHED",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🔐 Role Permissions Summary

| Action | SELLER | BUYER | USER | ADMIN | SUPER_ADMIN |
|--------|--------|-------|------|-------|-------------|
| Submit Product | ✅ | ❌ | ✅ | ✅ | ✅ |
| View Feed | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Images | ❌* | ✅ | ✅ | ✅ | ✅ |
| Update Product | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |

*Images are currently public, but SELLER cannot access feed where images are displayed

---

## 🎯 Frontend Implementation Checklist

### Product Submission Form
- [ ] Add `madeIn` input field (optional, max 100 chars)
- [ ] Add `expirationDate` input field (optional, flexible format)
- [ ] Display validation errors for date format
- [ ] Show user-friendly date format hints
- [ ] Handle date parsing on frontend (optional validation)

### Product Display
- [ ] Display `madeIn` field in product cards
- [ ] Display `expirationDateRaw` (preferred) or formatted `expirationDate`
- [ ] Display `availableTimeValue` and `availableTimeUnit` (if set by admin)
- [ ] Format dates for user-friendly display

### Admin Product Update
- [ ] Add `availableTimeValue` input (number, 1-1000)
- [ ] Add `availableTimeUnit` dropdown (hour, day, weeks, month)
- [ ] Handle default to "day" when only value is provided
- [ ] Allow setting both fields to null to remove

### Role-Based UI
- [ ] Check user role on app load
- [ ] Hide/show submit product button based on role
- [ ] Hide/show marketplace/feed based on role
- [ ] Show appropriate error messages for 403 errors
- [ ] Display role badge/indicator in user profile

### Error Handling
- [ ] Handle 403 errors for unauthorized actions
- [ ] Show user-friendly error messages
- [ ] Redirect or show appropriate UI based on role restrictions

---

## 📝 TypeScript Type Definitions

```typescript
// User Role Enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  SELLER = 'SELLER', // NEW
  BUYER = 'BUYER' // NEW
}

// Available Time Unit Enum
export enum AvailableTimeUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEKS = 'weeks',
  MONTH = 'month'
}

// Product Interface
export interface Product {
  _id: string;
  title: string;
  description?: string;
  originalPrice: number;
  finalPrice?: number;
  mediaFileId?: string;
  madeIn?: string; // NEW
  expirationDate?: string; // NEW - ISO date
  expirationDateRaw?: string; // NEW - Original format
  availableTimeValue?: number; // NEW
  availableTimeUnit?: AvailableTimeUnit; // NEW
  adminContact?: {
    username: string;
    phoneNumber: string;
  };
  status: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

// Product Submission Request
export interface SubmitProductRequest {
  title: string;
  description?: string;
  originalPrice: number;
  mediaFileId?: string;
  madeIn?: string; // NEW
  expirationDate?: string; // NEW - Flexible format
}

// Admin Product Update Request
export interface UpdateProductRequest {
  title?: string;
  description?: string;
  finalPrice?: number;
  madeIn?: string;
  expirationDate?: string;
  expirationDateRaw?: string;
  availableTimeValue?: number | null; // NEW
  availableTimeUnit?: AvailableTimeUnit | null; // NEW
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED';
}
```

---

## 🚀 Quick Start Examples

### Example 1: Submit Product with New Fields

```typescript
const submitProduct = async () => {
  const productData = {
    title: "Organic Coffee Beans",
    description: "Premium organic coffee from Colombia",
    originalPrice: 25,
    madeIn: "Colombia",
    expirationDate: "2026/12" // Flexible format
  };
  
  try {
    const response = await api.post('/products', productData);
    console.log('Product submitted:', response.data);
    // expirationDateRaw will be "2026/12"
    // expirationDate will be "2026-12-31T23:59:59.999Z"
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 2: Admin Update Product with Available Time

```typescript
const updateProduct = async (productId: string) => {
  const updateData = {
    availableTimeValue: 2,
    availableTimeUnit: 'weeks' as const
  };
  
  try {
    const response = await api.patch(`/products/${productId}`, updateData);
    console.log('Product updated:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 3: Role-Based Component Rendering

```typescript
const ProductActions = ({ userRole }: { userRole: string }) => {
  const canSubmit = ['SELLER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const canView = ['BUYER', 'USER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
  
  return (
    <div>
      {canSubmit && (
        <button onClick={handleSubmit}>Submit Product</button>
      )}
      {canView && (
        <button onClick={handleViewFeed}>View Marketplace</button>
      )}
      {!canSubmit && !canView && (
        <p>No permissions available</p>
      )}
    </div>
  );
};
```

---

## ⚠️ Important Notes

1. **Date Format Flexibility:** The backend accepts many date formats, but always store and display `expirationDateRaw` to users for consistency.

2. **Default Behavior:** If only `availableTimeValue` is provided (without `availableTimeUnit`), the backend automatically sets the unit to `"day"`.

3. **Role Restrictions:** 
   - SELLER cannot access `/api/products/feed` (will get 403)
   - BUYER cannot access `POST /api/products` (will get 403)

4. **Optional Fields:** All new fields are optional. The frontend should handle `null` and `undefined` values gracefully.

5. **Backward Compatibility:** Existing products without new fields will have `null` or `undefined` values. Always check before displaying.

---

## 📚 Additional Resources

- See `API_REFERENCE.md` for complete API documentation
- See `POSTMAN_TESTING.md` for testing examples
- See `BACKEND_ANALYSIS.md` for system architecture

---

**Last Updated:** Generated from latest backend implementation

