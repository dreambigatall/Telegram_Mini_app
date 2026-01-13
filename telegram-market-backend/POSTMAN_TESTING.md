# Postman Testing Guide

This guide explains how to test the API endpoints using Postman with mock authentication enabled.

## Setup

### 1. Enable Mock Authentication

Add to your `.env` file:
```env
ENABLE_MOCK_AUTH=true
```

**Important:** Make sure `BOT_TOKEN` is still set (can be any value when mock auth is enabled).

### 2. Start the Server

```bash
npm run dev
```

## Postman Configuration

### Headers to Add

For all requests, add these headers:

| Header Name | Value | Description |
|------------|-------|-------------|
| `x-mock-telegram-id` | `123456789` | Mock Telegram user ID (optional, defaults to 123456789) |
| `x-mock-role` | `USER` or `ADMIN` or `SUPER_ADMIN` | User role for testing (optional, defaults to USER) |
| `Content-Type` | `application/json` | For POST/PATCH requests |

**Note:** The `Authorization` header is NOT needed when mock auth is enabled.

---

## Test Examples

### Base URL
```
http://localhost:5000/api
```

---

## 1. Submit Product (with new fields)

**POST** `/products`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: USER
Content-Type: application/json
```

**Body (Year only):**
```json
{
  "title": "Test Product - Year Only",
  "description": "Testing expiration date with year only format",
  "originalPrice": 100,
  "madeIn": "USA",
  "expirationDate": "2026"
}
```

**Body (Year/Month):**
```json
{
  "title": "Test Product - Year/Month",
  "description": "Testing expiration date with year/month format",
  "originalPrice": 150,
  "madeIn": "China",
  "expirationDate": "2026/01"
}
```

**Body (Full Date):**
```json
{
  "title": "Test Product - Full Date",
  "description": "Testing expiration date with full date format",
  "originalPrice": 200,
  "madeIn": "Germany",
  "expirationDate": "2026/01/15"
}
```

**Body (ISO Date):**
```json
{
  "title": "Test Product - ISO Date",
  "description": "Testing expiration date with ISO format",
  "originalPrice": 250,
  "madeIn": "Japan",
  "expirationDate": "2026-01-15T12:00:00Z"
}
```

**Body (Without new fields - backward compatible):**
```json
{
  "title": "Test Product - No New Fields",
  "description": "Testing backward compatibility",
  "originalPrice": 300
}
```

**Body (Only madeIn):**
```json
{
  "title": "Test Product - Only MadeIn",
  "description": "Testing with only madeIn field",
  "originalPrice": 350,
  "madeIn": "France"
}
```

**Body (Null values):**
```json
{
  "title": "Test Product - Null Values",
  "description": "Testing with null values for new fields",
  "originalPrice": 400,
  "madeIn": null,
  "expirationDate": null
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Test Product",
    "description": "...",
    "originalPrice": 100,
    "madeIn": "USA",
    "expirationDate": "2026-12-31T23:59:59.999Z",
    "status": "PENDING",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Item submitted for review"
}
```

---

## 2. Get Product Feed

**GET** `/products/feed?page=1&limit=20`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: USER
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Product Name",
      "description": "...",
      "finalPrice": 150,
      "madeIn": "USA",
      "expirationDate": "2026-12-31T23:59:59.999Z",
      "adminContact": {
        "username": "@admin",
        "phoneNumber": "+1234567890"
      },
      "status": "PUBLISHED",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## 3. Get Pending Products (Admin Only)

**GET** `/products/pending?page=1&limit=20`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: ADMIN
```

**Expected Response:** Array of pending products with seller info

---

## 4. Approve Product (Admin Only)

**PATCH** `/products/:id/approve`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: ADMIN
Content-Type: application/json
```

**Body:**
```json
{
  "finalPrice": 150,
  "adminUsername": "@admin",
  "adminPhone": "+1234567890"
}
```

---

## 5. Update Product (Admin Only)

**PATCH** `/products/:id`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: ADMIN
Content-Type: application/json
```

**Body (Update madeIn and expirationDate):**
```json
{
  "madeIn": "Updated Country",
  "expirationDate": "2027/06"
}
```

**Body (Update all fields):**
```json
{
  "title": "Updated Product Title",
  "description": "Updated description",
  "finalPrice": 200,
  "madeIn": "Canada",
  "expirationDate": "2027-12-31T00:00:00Z",
  "adminContact": {
    "username": "@newadmin",
    "phoneNumber": "+9876543210"
  }
}
```

**Body (Set fields to null):**
```json
{
  "madeIn": null,
  "expirationDate": null
}
```

---

## 6. Delete Product (Admin Only)

**DELETE** `/products/:id`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: ADMIN
```

---

## 7. Get Current User

**GET** `/users/me`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: USER
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "telegramId": "123456789",
    "username": "postman_test_user",
    "firstName": "Postman Test",
    "role": "USER",
    "isBanned": false,
    "createdAt": "..."
  }
}
```

---

## 8. Get All Users (Super Admin Only)

**GET** `/admin/users?page=1&limit=20&role=USER&isBanned=false&search=test`

**Headers:**
```
x-mock-telegram-id: 123456789
x-mock-role: SUPER_ADMIN
```

---

## Testing Different Roles

### Test as Regular User
```
x-mock-role: USER
```

### Test as Admin
```
x-mock-role: ADMIN
```

### Test as Super Admin
```
x-mock-role: SUPER_ADMIN
```

---

## Validation Error Examples

### Invalid Date Format
**POST** `/products`
```json
{
  "title": "Test",
  "originalPrice": 100,
  "expirationDate": "invalid-date"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "expirationDate": {
      "message": "Invalid date format. Use: YYYY, YYYY/MM, YYYY/MM/DD, or ISO date format"
    }
  }
}
```

### Past Date
**POST** `/products`
```json
{
  "title": "Test",
  "originalPrice": 100,
  "expirationDate": "2020-01-01"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "expirationDate": {
      "message": "Expiration date must be in the future"
    }
  }
}
```

### MadeIn Too Long
**POST** `/products`
```json
{
  "title": "Test",
  "originalPrice": 100,
  "madeIn": "This is a very long string that exceeds the maximum allowed length of 100 characters and should fail validation"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "madeIn": {
      "message": "Made in location must not exceed 100 characters"
    }
  }
}
```

---

## Date Format Conversion Examples

| Input | Stored As | Description |
|-------|-----------|-------------|
| `"2026"` | `2026-12-31T23:59:59.999Z` | End of year |
| `"2026/01"` | `2026-01-31T23:59:59.999Z` | End of January |
| `"2026-01"` | `2026-01-31T23:59:59.999Z` | End of January (dash format) |
| `"2026/01/15"` | `2026-01-15T00:00:00.000Z` | Exact date |
| `"2026-01-15"` | `2026-01-15T00:00:00.000Z` | Exact date (dash format) |
| `"2026-01-15T12:00:00Z"` | `2026-01-15T12:00:00.000Z` | ISO format |

---

## Quick Test Checklist

- [ ] Submit product with year-only date (`"2026"`)
- [ ] Submit product with year/month date (`"2026/01"`)
- [ ] Submit product with full date (`"2026/01/15"`)
- [ ] Submit product with ISO date (`"2026-01-15T12:00:00Z"`)
- [ ] Submit product with `madeIn` only
- [ ] Submit product without new fields (backward compatibility)
- [ ] Submit product with null values
- [ ] Update product with new fields
- [ ] Update product to set fields to null
- [ ] Test validation errors (invalid date, past date, long madeIn)
- [ ] Test as different roles (USER, ADMIN, SUPER_ADMIN)

---

## Notes

1. **Mock User Creation**: The first request with a `x-mock-telegram-id` will automatically create a user in the database.

2. **Role Switching**: Change the `x-mock-role` header to test different permission levels.

3. **Multiple Users**: Use different `x-mock-telegram-id` values to test with multiple users.

4. **Production Warning**: Never enable `ENABLE_MOCK_AUTH=true` in production! This bypasses all authentication.

5. **Database**: Make sure MongoDB is running and connected.

---

## Troubleshooting

### Error: "Not authorized, no token"
- Make sure `ENABLE_MOCK_AUTH=true` is set in `.env`
- Restart the server after changing `.env`

### Error: "BOT_TOKEN is missing"
- Even with mock auth, BOT_TOKEN should be set in `.env` (can be any value)

### Error: "Access Denied. You need an invite."
- The mock user might not exist yet. Make a request and it will be created automatically.

### Products not showing in feed
- Products need to be approved by an ADMIN first
- Use `x-mock-role: ADMIN` to approve products

