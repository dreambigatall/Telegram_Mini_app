# API Reference - Quick Guide

## 🔗 Base URL
```
http://localhost:5000/api
```

## 🔑 Authentication
All protected endpoints require `Authorization` header with Telegram `initData`:
```
Authorization: <telegram_initData_string>
```

---

## 📋 Endpoints Summary

### 🔓 Public Endpoints

#### Health Check
```http
GET /health
GET /health/detailed
GET /health/metrics
```

#### Get Product Image
```http
GET /api/products/image/:fileId
```

---

### 👤 User Endpoints

#### Get Current User
```http
GET /api/users/me
Authorization: <telegram_initData>

Response: {
  "success": true,
  "data": {
    "_id": "...",
    "telegramId": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "role": "USER",
    "isBanned": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 📦 Product Endpoints

#### Submit Product
```http
POST /api/products
Authorization: <telegram_initData>
Content-Type: application/json

Body: {
  "title": "Product Title" (3-200 chars, required),
  "description": "Description" (max 2000 chars, optional),
  "originalPrice": 100 (positive number, required),
  "mediaFileId": "AgACAgIAAxkBAA..." (optional)
}

Response: {
  "success": true,
  "data": { /* product object */ },
  "message": "Item submitted for review"
}
```

#### Get Published Feed
```http
GET /api/products/feed?page=1&limit=20
Authorization: <telegram_initData>

Response: {
  "success": true,
  "data": [ /* array of published products */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Pending Products (Admin Only)
```http
GET /api/products/pending?page=1&limit=20
Authorization: <telegram_initData>
Role: ADMIN or SUPER_ADMIN

Response: [ /* array of pending products with seller info */ ]
```

#### Approve Product (Admin Only)
```http
PATCH /api/products/:id/approve
Authorization: <telegram_initData>
Role: ADMIN or SUPER_ADMIN
Content-Type: application/json

Body: {
  "finalPrice": 150 (optional, defaults to originalPrice),
  "adminUsername": "@admin" (optional),
  "adminPhone": "+1234567890" (optional)
}

Response: {
  "success": true,
  "data": { /* approved product */ },
  "message": "Product Published"
}
```

#### Reject Product (Admin Only)
```http
PATCH /api/products/:id/reject
Authorization: <telegram_initData>
Role: ADMIN or SUPER_ADMIN
Content-Type: application/json

Body: {
  "reason": "Does not meet guidelines" (max 500 chars, optional)
}

Response: {
  "success": true,
  "data": null,
  "message": "Product Rejected"
}
```

---

### 👨‍💼 Admin Endpoints

#### Generate Invite
```http
POST /api/admin/invite
Authorization: <telegram_initData>
Role: ADMIN or SUPER_ADMIN
Content-Type: application/json

Body: {
  "role": "USER" | "ADMIN" (required)
}

Note: Only SUPER_ADMIN can create ADMIN invites

Response: {
  "success": true,
  "data": {
    "inviteCode": "a1b2c3d4",
    "role": "USER",
    "link": "https://t.me/botname?start=a1b2c3d4"
  },
  "message": "Invite generated successfully"
}
```

---

## 🔴 Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access Denied. You need an invite."
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": { /* Zod validation errors */ }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## 📊 Product Status Flow

```
PENDING → [Admin Approves] → PUBLISHED → [Sold] → SOLD
       ↓
    [Admin Rejects] → REJECTED
```

---

## 🔐 Role Permissions

| Action | USER | ADMIN | SUPER_ADMIN |
|--------|------|-------|-------------|
| View profile | ✅ | ✅ | ✅ |
| Submit products | ✅ | ✅ | ✅ |
| View published feed | ✅ | ✅ | ✅ |
| View pending products | ❌ | ✅ | ✅ |
| Approve products | ❌ | ✅ | ✅ |
| Reject products | ❌ | ✅ | ✅ |
| Generate USER invites | ❌ | ✅ | ✅ |
| Generate ADMIN invites | ❌ | ❌ | ✅ |

---

## 📝 Notes

1. **Pagination**: Default `page=1`, `limit=20` for all list endpoints
2. **Caching**: Product feeds cached for 5 minutes, pending for 2 minutes
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **File IDs**: Use Telegram bot to get file IDs by sending photos
5. **Privacy**: Seller information hidden from public API responses

---

*For detailed analysis, see BACKEND_ANALYSIS.md*

