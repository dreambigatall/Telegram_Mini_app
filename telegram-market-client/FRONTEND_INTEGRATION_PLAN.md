# Frontend Integration Plan - New Admin Features

## 📋 Overview

Integration plan for the new backend endpoints following existing frontend patterns and structure.

**New Endpoints to Integrate:**
1. **Product Management** (Admin & Super Admin): Update & Delete published products
2. **User Management** (Super Admin Only): List, Update, Delete users

---

## 🔍 Current Frontend Architecture Analysis

### Existing Patterns
- ✅ **API Integration**: `src/utils/api.ts` - Axios with Telegram initData interceptor
- ✅ **State Management**: React Context (`AuthContext`) for user/auth state
- ✅ **Pages Structure**: `src/pages/` - FeedPage, AdminPage, SellPage
- ✅ **Components**: Modal, Toast, ErrorBoundary, etc.
- ✅ **Types**: `src/types/index.ts` - TypeScript interfaces
- ✅ **Admin Page**: Tab-based UI (Products/Invites)

### API Call Pattern
```typescript
// Pattern used in existing code
const response = await api.get('/products/pending');
const response = await api.patch(`/products/${id}/approve`, { ...data });
const response = await api.post('/admin/invite', { role });
```

### Response Handling Pattern
```typescript
// Backend returns: { success: true, data: {...}, message: "..." }
if (response.data.success && response.data.data) {
  // Handle success
} else {
  // Handle error
}
```

---

## 🎯 Phase 1: Product Management Integration (Admin & Super Admin)

### 1.1 Update Published Product

**Backend Endpoint**: `PATCH /api/products/:id`

**Changes Needed**:

#### A. Update Types (`src/types/index.ts`)
```typescript
// Add to Product interface
export interface Product {
  // ... existing fields
  status: 'PENDING' | 'PUBLISHED' | 'SOLD' | 'REJECTED' | 'DELETED'; // Add DELETED
  // ... rest of fields
}

// Add new interface for update payload
export interface UpdateProductPayload {
  title?: string;
  description?: string;
  finalPrice?: number;
  adminContact?: {
    username?: string;
    phoneNumber?: string;
  };
  status?: Product['status'];
}
```

#### B. Create Update Product Modal Component (`src/components/UpdateProductModal.tsx`)
- **Purpose**: Modal for editing published products
- **Fields**: Title, Description, Final Price, Admin Contact, Status
- **Pattern**: Similar to `PriceInputModal.tsx` and `RejectModal.tsx`
- **Features**:
  - Pre-fill with current product data
  - Validate inputs
  - Submit update via API
  - Show success/error toast

#### C. Update AdminPage (`src/pages/AdminPage.tsx`)
- **New Tab**: Add "Published" tab (or show in existing Products tab)
- **State**: Add `publishedProducts` state
- **Fetch**: Add `fetchPublishedProducts()` function
- **Actions**: Add "Edit" and "Delete" buttons for each published product
- **Handlers**:
  - `handleUpdateClick(product)` - Open update modal
  - `handleUpdateSubmit(data)` - Call API to update
  - `handleDeleteClick(product)` - Show delete confirmation
  - `handleDeleteConfirm(id)` - Call API to delete
- **UI Pattern**: Follow existing approve/reject pattern

**Files to Modify**:
1. ✅ `src/types/index.ts` - Add UpdateProductPayload interface
2. ✅ `src/components/UpdateProductModal.tsx` - NEW FILE
3. ✅ `src/components/DeleteConfirmModal.tsx` - NEW FILE (reusable)
4. ✅ `src/pages/AdminPage.tsx` - Add update/delete functionality

---

### 1.2 Delete Published Product

**Backend Endpoint**: `DELETE /api/products/:id`

**Changes Needed**:

#### A. Create Delete Confirmation Modal (`src/components/DeleteConfirmModal.tsx`)
- **Purpose**: Reusable modal for delete confirmations
- **Pattern**: Similar to `RejectModal.tsx` but simpler
- **Features**:
  - Show item title/name
  - Warning message
  - Confirm/Cancel buttons
  - Handle delete action

#### B. Update AdminPage (`src/pages/AdminPage.tsx`)
- **Add Delete Handler**: `handleDeleteProduct(id)`
- **Call API**: `await api.delete(`/products/${id}`)`
- **Refresh List**: After successful delete
- **Show Toast**: Success/error notification

**Files to Modify**:
1. ✅ `src/components/DeleteConfirmModal.tsx` - NEW FILE
2. ✅ `src/pages/AdminPage.tsx` - Add delete functionality

---

## 🎯 Phase 2: User Management Integration (Super Admin Only)

### 2.1 List All Users

**Backend Endpoint**: `GET /api/admin/users?page=1&limit=20&role=USER&isBanned=false&search=john`

**Changes Needed**:

#### A. Update Types (`src/types/index.ts`)
```typescript
// Add User interface (if not exists or update)
export interface User {
  _id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned: boolean;
  isDeleted?: boolean; // Add for soft delete
  createdAt?: string;
}

// Add user list response type
export interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### B. Update AuthContext (`src/context/AuthContext.tsx`)
- **Add**: `isSuperAdmin` boolean helper
- **Purpose**: Check if current user is SUPER_ADMIN
```typescript
const isSuperAdmin = user?.role === 'SUPER_ADMIN';
// Add to context value
```

#### C. Create User Management Page (`src/pages/UserManagementPage.tsx`)
- **Purpose**: New page for Super Admin user management
- **Features**:
  - User list table/cards
  - Pagination controls
  - Filter by role (dropdown)
  - Filter by isBanned (toggle)
  - Search by username/firstName (input)
  - Edit button per user
  - Delete button per user
- **State**:
  - `users: User[]`
  - `loading: boolean`
  - `page: number`
  - `limit: number`
  - `total: number`
  - `filters: { role?, isBanned?, search? }`
- **Functions**:
  - `fetchUsers()` - Fetch users with filters
  - `handleFilterChange()` - Update filters and refetch
  - `handlePageChange()` - Update pagination
  - `handleEditClick()` - Open edit modal
  - `handleDeleteClick()` - Show delete confirmation

#### D. Update App.tsx Routing (if needed)
- **Add Route**: `/admin/users` for UserManagementPage
- **Condition**: Only accessible to SUPER_ADMIN
- **Navigation**: Add link in Navbar for Super Admin

#### E. Update Navbar (`src/components/Navbar.tsx`)
- **Add**: "Users" tab/link for SUPER_ADMIN only
- **Condition**: `user?.role === 'SUPER_ADMIN'`
- **Location**: Next to Admin tab

**Files to Create/Modify**:
1. ✅ `src/types/index.ts` - Add User, UserListResponse types
2. ✅ `src/context/AuthContext.tsx` - Add isSuperAdmin helper
3. ✅ `src/pages/UserManagementPage.tsx` - NEW FILE
4. ✅ `src/components/Navbar.tsx` - Add Users link for Super Admin
5. ✅ `src/App.tsx` - Add route (if using routing)

---

### 2.2 Update User

**Backend Endpoint**: `PATCH /api/admin/users/:id`

**Changes Needed**:

#### A. Create Update User Modal (`src/components/UpdateUserModal.tsx`)
- **Purpose**: Modal for editing user details
- **Fields**:
  - Username (optional)
  - First Name (optional)
  - Role (dropdown: USER, ADMIN, SUPER_ADMIN)
  - Is Banned (checkbox)
- **Validation**:
  - Prevent self-role downgrade
  - Prevent self-banning
- **Pattern**: Similar to UpdateProductModal

#### B. Update UserManagementPage (`src/pages/UserManagementPage.tsx`)
- **Add Update Handler**: `handleUpdateUser(id, data)`
- **Call API**: `await api.patch(`/admin/users/${id}`, data)`
- **Refresh List**: After successful update
- **Show Toast**: Success/error notification
- **Error Handling**: Handle 403 (self-downgrade/ban) errors

**Files to Create/Modify**:
1. ✅ `src/components/UpdateUserModal.tsx` - NEW FILE
2. ✅ `src/pages/UserManagementPage.tsx` - Add update functionality

---

### 2.3 Delete User

**Backend Endpoint**: `DELETE /api/admin/users/:id`

**Changes Needed**:

#### A. Reuse Delete Confirmation Modal (`src/components/DeleteConfirmModal.tsx`)
- **Same Modal**: Use for both products and users
- **Make Generic**: Accept `title` prop (product title or username)

#### B. Update UserManagementPage (`src/pages/UserManagementPage.tsx`)
- **Add Delete Handler**: `handleDeleteUser(id)`
- **Call API**: `await api.delete(`/admin/users/${id}`)`
- **Refresh List**: After successful delete
- **Show Toast**: Success/error notification
- **Error Handling**: Handle 403 (self-deletion) error

**Files to Modify**:
1. ✅ `src/components/DeleteConfirmModal.tsx` - Make generic
2. ✅ `src/pages/UserManagementPage.tsx` - Add delete functionality

---

## 📁 File Structure Summary

### New Files to Create (5)
1. `src/components/UpdateProductModal.tsx`
2. `src/components/DeleteConfirmModal.tsx` (reusable)
3. `src/components/UpdateUserModal.tsx`
4. `src/pages/UserManagementPage.tsx`
5. `src/types/user.ts` (optional - if you want separate file)

### Files to Modify (7)
1. `src/types/index.ts` - Add types/interfaces
2. `src/context/AuthContext.tsx` - Add isSuperAdmin
3. `src/pages/AdminPage.tsx` - Add update/delete products
4. `src/components/Navbar.tsx` - Add Users link (Super Admin)
5. `src/App.tsx` - Add route (if needed)
6. `src/utils/api.ts` - No changes needed (existing pattern works)
7. `src/components/Toast.tsx` - No changes (existing pattern works)

---

## 🔄 Integration Flow

### Product Update Flow
```
1. Admin opens AdminPage → Published tab
2. Clicks "Edit" on a product
3. UpdateProductModal opens with pre-filled data
4. Admin edits fields → Clicks "Save"
5. API call: PATCH /api/products/:id
6. Success → Toast notification → Refresh list
7. Error → Error toast → Modal stays open
```

### Product Delete Flow
```
1. Admin clicks "Delete" on a product
2. DeleteConfirmModal opens with warning
3. Admin confirms → API call: DELETE /api/products/:id
4. Success → Toast → Product removed from list
5. Error → Error toast
```

### User Management Flow
```
1. Super Admin navigates to User Management page
2. Users list loads with pagination/filters
3. Super Admin can:
   - Filter by role/isBanned
   - Search by name
   - Edit user → UpdateUserModal
   - Delete user → DeleteConfirmModal
4. Changes persist and list refreshes
```

---

## 🎨 UI/UX Considerations

### AdminPage Enhancements
- **Option A**: Add third tab "Published" (Products | Published | Invites)
- **Option B**: Keep two tabs, add "Published Products" section in Products tab
- **Recommendation**: Option A for clarity

### UserManagementPage UI
- **Layout**: Card-based or table-based list
- **Filters**: Top section with dropdowns and search
- **Actions**: Edit/Delete buttons on each user card
- **Pagination**: Bottom pagination controls
- **Empty State**: "No users found" message

### Modals Consistency
- **Pattern**: Follow existing modal pattern (Modal.tsx)
- **Styling**: Use Tailwind classes consistent with existing modals
- **Accessibility**: Close on Escape, click outside, etc.

---

## 🔐 Security & Authorization

### Frontend Checks
- ✅ Check `isAdmin` before showing product update/delete buttons
- ✅ Check `isSuperAdmin` before showing User Management link
- ✅ Show 403 error toast if unauthorized actions attempted
- ✅ Disable self-delete/self-ban buttons (visual feedback)

### API Error Handling
- ✅ Handle 401 (Unauthorized) - redirect or show error
- ✅ Handle 403 (Forbidden) - show specific error message
- ✅ Handle 404 (Not found) - show error toast
- ✅ Handle 400 (Validation errors) - show field-specific errors

---

## 📝 Implementation Checklist

### Phase 1: Product Management
- [ ] Update `Product` type to include `DELETED` status
- [ ] Create `UpdateProductPayload` interface
- [ ] Create `UpdateProductModal.tsx` component
- [ ] Create `DeleteConfirmModal.tsx` component (generic)
- [ ] Update `AdminPage.tsx`:
  - [ ] Add "Published" tab or section
  - [ ] Add `fetchPublishedProducts()` function
  - [ ] Add update/delete handlers
  - [ ] Add Edit/Delete buttons to product cards
- [ ] Test product update flow
- [ ] Test product delete flow
- [ ] Handle error cases (404, 403, 400)

### Phase 2: User Management
- [ ] Add `User` and `UserListResponse` types
- [ ] Update `AuthContext` to include `isSuperAdmin`
- [ ] Create `UserManagementPage.tsx`:
  - [ ] User list display
  - [ ] Pagination
  - [ ] Filters (role, isBanned, search)
  - [ ] Edit/Delete actions
- [ ] Create `UpdateUserModal.tsx` component
- [ ] Update `DeleteConfirmModal.tsx` to be generic
- [ ] Update `Navbar.tsx` to show Users link (Super Admin only)
- [ ] Add route in `App.tsx` (if using routing)
- [ ] Test user list flow
- [ ] Test user update flow
- [ ] Test user delete flow
- [ ] Handle error cases (self-deletion, self-ban, etc.)

---

## 🧪 Testing Scenarios

### Product Management
- [ ] Update product as ADMIN (should work)
- [ ] Update product as SUPER_ADMIN (should work)
- [ ] Update product as USER (should fail with 403)
- [ ] Delete product as ADMIN (should work)
- [ ] Delete product as SUPER_ADMIN (should work)
- [ ] Delete product as USER (should fail with 403)
- [ ] Update non-existent product (should show 404)
- [ ] Delete non-existent product (should show 404)

### User Management
- [ ] Access User Management as SUPER_ADMIN (should work)
- [ ] Access User Management as ADMIN (should fail with 403)
- [ ] Access User Management as USER (should fail with 403)
- [ ] List users with pagination
- [ ] Filter users by role
- [ ] Filter users by isBanned
- [ ] Search users by name
- [ ] Update user as SUPER_ADMIN (should work)
- [ ] Update self as SUPER_ADMIN (should fail for role downgrade)
- [ ] Delete user as SUPER_ADMIN (should work)
- [ ] Delete self as SUPER_ADMIN (should fail with 403)
- [ ] Update non-existent user (should show 404)
- [ ] Delete non-existent user (should show 404)

---

## 📚 Code Examples

### Example: Update Product Handler
```typescript
const handleUpdateProduct = async (id: string, data: UpdateProductPayload) => {
  try {
    const response = await api.patch(`/products/${id}`, data);
    if (response.data.success) {
      showToast('Product updated successfully!', 'success');
      fetchPublishedProducts(); // Refresh list
      setUpdateModalOpen(false);
    }
  } catch (err: any) {
    const message = err.response?.data?.error || 'Failed to update product';
    showToast(message, 'error');
  }
};
```

### Example: Delete Product Handler
```typescript
const handleDeleteProduct = async (id: string) => {
  try {
    await api.delete(`/products/${id}`);
    showToast('Product deleted successfully!', 'success');
    fetchPublishedProducts(); // Refresh list
    setDeleteModalOpen(false);
  } catch (err: any) {
    const message = err.response?.data?.error || 'Failed to delete product';
    showToast(message, 'error');
  }
};
```

### Example: Fetch Users with Filters
```typescript
const fetchUsers = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters.role && { role: filters.role }),
      ...(filters.isBanned !== undefined && { isBanned: filters.isBanned.toString() }),
      ...(filters.search && { search: filters.search }),
    });
    
    const response = await api.get(`/admin/users?${params}`);
    if (response.data.success) {
      setUsers(response.data.data);
      setTotal(response.data.pagination.total);
    }
  } catch (err: any) {
    showToast('Failed to load users', 'error');
  } finally {
    setLoading(false);
  }
};
```

---

## ✅ Implementation Order

### Recommended Order
1. **Phase 1A**: Product Update (UpdateProductModal + AdminPage integration)
2. **Phase 1B**: Product Delete (DeleteConfirmModal + AdminPage integration)
3. **Phase 2A**: User List (UserManagementPage + types + routing)
4. **Phase 2B**: User Update (UpdateUserModal + UserManagementPage integration)
5. **Phase 2C**: User Delete (UserManagementPage integration using existing modal)

---

## 🎯 Key Decisions

### 1. AdminPage Tab Structure
**Decision**: Add third tab "Published" alongside "Products" and "Invites"
- Clear separation of pending vs published products
- Easier to navigate
- Follows existing tab pattern

### 2. Delete Confirmation Modal
**Decision**: Create one reusable `DeleteConfirmModal.tsx`
- Used for both products and users
- Generic enough to accept title/name prop
- Consistent UX

### 3. User Management Page
**Decision**: Create separate `UserManagementPage.tsx`
- Keeps AdminPage focused on products/invites
- Clear separation of concerns
- Easier to maintain

### 4. Super Admin Check
**Decision**: Add `isSuperAdmin` to AuthContext
- Consistent with existing `isAdmin` pattern
- Easy to use across components
- Type-safe

---

**Status**: 📋 **PLAN READY FOR IMPLEMENTATION**

*All integration patterns follow existing codebase structure and conventions.*

