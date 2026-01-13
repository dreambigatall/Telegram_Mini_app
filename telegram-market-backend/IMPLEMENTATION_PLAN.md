# Implementation Plan: New Admin Features

## 📋 Overview

Add new endpoints for:
1. **Admin & Super Admin**: Update and Delete published products
2. **Super Admin Only**: User management (List, Update, Delete users)

---

## 🎯 Feature 1: Product Management (Admin & Super Admin)

### 1.1 Update Published Product

**Endpoint**: `PATCH /api/products/:id`
- **Auth**: ✅ Required
- **Role**: ADMIN, SUPER_ADMIN
- **Action**: Update published product details

**Request Body**:
```typescript
{
  title?: string (3-200 chars, optional)
  description?: string (max 2000 chars, optional)
  finalPrice?: number (positive, optional)
  adminContact?: {
    username?: string (optional)
    phoneNumber?: string (optional)
  }
  status?: ProductStatus (optional) // Allow status changes
}
```

**Response**: Updated product object

**Implementation Steps**:
1. ✅ Create validation schema: `updateProductSchema` in `validations/productValidation.ts`
2. ✅ Add service method: `ProductService.updateProduct()` in `services/productService.ts`
3. ✅ Add controller: `updateProduct()` in `controllers/productController.ts`
4. ✅ Add route: `PATCH /api/products/:id` in `routes/productRoutes.ts`
5. ✅ Clear product caches after update
6. ✅ Log the update action

---

### 1.2 Delete Published Product

**Endpoint**: `DELETE /api/products/:id`
- **Auth**: ✅ Required
- **Role**: ADMIN, SUPER_ADMIN
- **Action**: Soft delete or hard delete published product

**Request**: No body needed

**Response**: Success message with deleted product ID

**Implementation Steps**:
1. ✅ Add service method: `ProductService.deleteProduct()` in `services/productService.ts`
2. ✅ Add controller: `deleteProduct()` in `controllers/productController.ts`
3. ✅ Add route: `DELETE /api/products/:id` in `routes/productRoutes.ts`
4. ✅ Decide: Soft delete (status: DELETED) or Hard delete (remove from DB)
   - **Recommendation**: Soft delete with new status `DELETED` for audit trail
5. ✅ Clear all product caches
6. ✅ Optionally notify seller about deletion
7. ✅ Log the deletion action

---

## 🎯 Feature 2: User Management (Super Admin Only)

### 2.1 List All Users

**Endpoint**: `GET /api/admin/users`
- **Auth**: ✅ Required
- **Role**: SUPER_ADMIN only
- **Action**: Get paginated list of all users

**Query Parameters**:
```typescript
page?: number (default: 1)
limit?: number (default: 20)
role?: UserRole (optional filter)
isBanned?: boolean (optional filter)
search?: string (optional - search by username/firstName)
```

**Response**:
```typescript
{
  success: true,
  data: User[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

**Implementation Steps**:
1. ✅ Add service method: `UserService.getAllUsers()` in `services/userService.ts` (new file)
2. ✅ Add controller: `getAllUsers()` in `controllers/adminController.ts`
3. ✅ Add route: `GET /api/admin/users` in `routes/adminRoutes.ts`
4. ✅ Add pagination support
5. ✅ Add filtering by role, isBanned
6. ✅ Add search functionality (username, firstName)
7. ✅ Cache user list (short TTL - 1 minute)
8. ✅ Exclude sensitive data if needed

---

### 2.2 Update User

**Endpoint**: `PATCH /api/admin/users/:id`
- **Auth**: ✅ Required
- **Role**: SUPER_ADMIN only
- **Action**: Update user details

**Request Body**:
```typescript
{
  username?: string (optional)
  firstName?: string (optional)
  role?: UserRole (optional) // SUPER_ADMIN can change roles
  isBanned?: boolean (optional)
}
```

**Response**: Updated user object

**Implementation Steps**:
1. ✅ Create validation schema: `updateUserSchema` in `validations/userValidation.ts` (new file)
2. ✅ Add service method: `UserService.updateUser()` in `services/userService.ts`
3. ✅ Add controller: `updateUser()` in `controllers/adminController.ts`
4. ✅ Add route: `PATCH /api/admin/users/:id` in `routes/adminRoutes.ts`
5. ✅ Validate: Can't ban yourself, can't downgrade SUPER_ADMIN role
6. ✅ Clear user cache after update
7. ✅ Optionally notify user about changes (role change, ban status)
8. ✅ Log the update action

---

### 2.3 Delete User

**Endpoint**: `DELETE /api/admin/users/:id`
- **Auth**: ✅ Required
- **Role**: SUPER_ADMIN only
- **Action**: Delete user from system

**Request**: No body needed

**Response**: Success message with deleted user ID

**Implementation Steps**:
1. ✅ Add service method: `UserService.deleteUser()` in `services/userService.ts`
2. ✅ Add controller: `deleteUser()` in `controllers/adminController.ts`
3. ✅ Add route: `DELETE /api/admin/users/:id` in `routes/adminRoutes.ts`
4. ✅ Validation: Can't delete yourself
5. ✅ Handle cascading:
   - **Option A**: Soft delete (isDeleted flag) - Recommended
   - **Option B**: Hard delete - Need to handle:
     - Delete user's products? (or orphan them)
     - Delete user's invites? (or mark createdBy as null)
     - Handle foreign key constraints
6. ✅ Clear user cache
7. ✅ Optionally notify user via Telegram
8. ✅ Log the deletion action

**Recommendation**: Use soft delete with `isDeleted: true` flag for audit trail

---

## 📁 Files to Create/Modify

### New Files:
1. ✅ `src/services/userService.ts` - User business logic
2. ✅ `src/validations/userValidation.ts` - User validation schemas

### Files to Modify:

#### `src/routes/productRoutes.ts`
- Add `PATCH /api/products/:id` (update product)
- Add `DELETE /api/products/:id` (delete product)

#### `src/routes/adminRoutes.ts`
- Add `GET /api/admin/users` (list users)
- Add `PATCH /api/admin/users/:id` (update user)
- Add `DELETE /api/admin/users/:id` (delete user)

#### `src/controllers/productController.ts`
- Add `updateProduct()` function
- Add `deleteProduct()` function

#### `src/controllers/adminController.ts`
- Add `getAllUsers()` function
- Add `updateUser()` function
- Add `deleteUser()` function

#### `src/services/productService.ts`
- Add `updateProduct()` method
- Add `deleteProduct()` method

#### `src/validations/productValidation.ts`
- Add `updateProductSchema` for updating products

#### `src/models/Product.ts` (Optional)
- Consider adding `DELETED` status to `ProductStatus` enum if using soft delete

#### `src/models/User.ts` (Optional)
- Consider adding `isDeleted?: boolean` field if using soft delete
- Add indexes for filtering if needed

---

## 🔐 Security Considerations

### Product Update/Delete:
- ✅ Verify product exists
- ✅ Only allow updates/deletes on PUBLISHED products (or all statuses?)
- ✅ Log who made the change (req.user)
- ✅ Cache invalidation after changes

### User Management:
- ✅ SUPER_ADMIN only - strict authorization check
- ✅ Prevent self-deletion
- ✅ Prevent self-banning (or allow?)
- ✅ Prevent downgrading your own SUPER_ADMIN role
- ✅ Validate ObjectId format before queries
- ✅ Handle case where user not found

---

## 📊 Database Considerations

### Product Deletion:
- **Soft Delete**: Add `DELETED` status, keep data
- **Hard Delete**: Remove from DB, handle related data

### User Deletion:
- **Soft Delete**: Add `isDeleted` flag, keep data
- **Hard Delete**: Remove from DB, handle:
  - Products (orphan or delete?)
  - Invites (set createdBy to null or delete?)
  - Any other references

**Recommendation**: Use **Soft Delete** for audit trail and data recovery

---

## 🧪 Validation Rules

### Update Product:
- `title`: min 3, max 200 chars
- `description`: max 2000 chars
- `finalPrice`: positive number, max 10M
- `adminContact.username`: max 100 chars
- `adminContact.phoneNumber`: max 20 chars
- `status`: must be valid ProductStatus enum value

### Update User:
- `username`: max 50 chars, alphanumeric + underscore
- `firstName`: max 100 chars
- `role`: must be valid UserRole enum
- `isBanned`: boolean

---

## 📝 Error Handling

### Common Errors:
- ✅ 400: Invalid request body / validation errors
- ✅ 401: Not authenticated
- ✅ 403: Not authorized (wrong role)
- ✅ 404: Product/User not found
- ✅ 409: Conflict (e.g., trying to delete yourself)
- ✅ 500: Server errors

---

## 🎨 Response Format

All endpoints should follow existing pattern:
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}

// Paginated Response
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

---

## 🚀 Implementation Order

### Phase 1: Product Management (Admin & Super Admin)
1. Update Product endpoint
2. Delete Product endpoint

### Phase 2: User Management (Super Admin Only)
1. List Users endpoint
2. Update User endpoint
3. Delete User endpoint

---

## 📌 Important Notes

1. **Cache Management**: Clear relevant caches after any update/delete
2. **Logging**: Log all admin actions for audit trail
3. **Notifications**: Consider notifying affected users (optional)
4. **Soft Delete**: Recommended for data recovery and audit
5. **Validation**: Strict validation on all inputs
6. **Authorization**: Double-check role permissions in controllers
7. **Error Messages**: Provide clear, helpful error messages

---

## ✅ Testing Checklist

### Product Endpoints:
- [ ] Update published product (success)
- [ ] Update non-existent product (404)
- [ ] Update as regular user (403)
- [ ] Delete published product (success)
- [ ] Delete non-existent product (404)
- [ ] Delete as regular user (403)
- [ ] Cache invalidation works

### User Endpoints:
- [ ] List all users as SUPER_ADMIN (success)
- [ ] List users as ADMIN (403)
- [ ] Update user as SUPER_ADMIN (success)
- [ ] Update yourself (403 for role change?)
- [ ] Delete user as SUPER_ADMIN (success)
- [ ] Delete yourself (409 conflict)
- [ ] Delete non-existent user (404)
- [ ] Pagination works correctly
- [ ] Filtering works correctly
- [ ] Search functionality works

---

*Ready for implementation!*

