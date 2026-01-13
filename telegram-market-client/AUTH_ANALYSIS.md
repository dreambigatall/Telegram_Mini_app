# Authentication Flow Analysis & Replan

## 🔍 Current State Analysis

### Backend Authentication Flow
1. **Frontend sends request** → `api.ts` interceptor attaches `WebApp.initData` to `Authorization` header ✅
2. **Backend receives** → `protect` middleware extracts `initData` from `Authorization` header ✅
3. **Validation** → `validateTelegramData()` verifies HMAC signature against BOT_TOKEN ✅
4. **User lookup** → Queries database by `telegramId`, caches for 2 minutes ✅
5. **Attach user** → Sets `req.user = user` (IUser model) ✅
6. **❌ MISSING**: No `/users/me` endpoint to fetch current user


### Frontend Authentication State
- **Current**: Mock data hardcoded in `AuthContext.tsx` (lines 35-43)
- **Usage**: 
  - `App.tsx`: Wraps app with `<AuthProvider>`
  - `Navbar.tsx`: Uses `useAuth()` hook to check `isAdmin` for conditional rendering
- **Expected**: API call to `/users/me` to get real user data

## 🔧 Implementation Plan

### STEP 1: Backend - Create `/users/me` Endpoint

**File**: `telegram-market-backend/src/routes/userRoutes.ts` (NEW)
```typescript
// GET /api/users/me
// Protected route that returns current authenticated user
```

**File**: `telegram-market-backend/src/controllers/userController.ts` (NEW)
```typescript
// getCurrentUser controller
// Returns user data from req.user (set by protect middleware)
```

**Response Shape**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "telegramId": "123456789",
    "username": "john_doe",
    "firstName": "John",
    "role": "USER",
    "isBanned": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Steps**:
1. Create `userRoutes.ts` with `/me` endpoint
2. Create `userController.ts` with `getCurrentUser` function
3. Register route in `server.ts`: `app.use('/api/users', userRoutes);`
4. Use `protect` middleware (already validates and sets req.user)

### STEP 2: Frontend - Replace Mock Auth

**File**: `telegram-market-client/src/context/AuthContext.tsx`

**Changes**:
1. Replace mock data (lines 28-44) with real API call
2. Handle loading states
3. Handle error states (401, 403, network errors)
4. Map backend response to frontend User interface

**Data Transformation**:
```typescript
// Backend response: { _id, telegramId, username, firstName, role, isBanned }
// Frontend needs: { id, username, role }
const transformUser = (backendUser: any): User => ({
  id: backendUser._id || backendUser.telegramId,
  username: backendUser.username || backendUser.firstName || 'Unknown',
  role: backendUser.role
});
```

**Error Handling**:
- 401/403: User not authenticated or banned → Set user to null
- Network error: Retry or show offline message
- No initData: Show message about needing Telegram environment

### STEP 3: Frontend - Update User Interface

**File**: `telegram-market-client/src/types/index.ts` or `AuthContext.tsx`

**Options**:
- Option A: Keep simple interface, map backend → frontend
- Option B: Extend interface to match backend (recommended)

**Recommended Interface**:
```typescript
interface User {
  id: string;              // Maps from _id or telegramId
  telegramId?: string;     // Keep for reference
  username?: string;       // Optional (can be undefined)
  firstName?: string;      // Add this
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned?: boolean;      // Add for safety checks
}
```

### STEP 4: Error Handling & Edge Cases

**Scenarios to Handle**:
1. **No initData** (browser testing):
   - Option: Show warning, use dev mock (only in dev mode)
   - Or: Block app, show "Use Telegram to access"

2. **User not registered** (403):
   - Show message: "Access Denied. You need an invite."
   - Optionally: Show invite link input

3. **User banned** (403):
   - Show message: "You are banned."
   - Block all actions

4. **Network errors**:
   - Retry logic (exponential backoff)
   - Show offline indicator
   - Cache last known user state

5. **Token expired** (rare with initData):
   - Refresh or re-authenticate

### STEP 5: Type Safety Improvements

**Backend**: Create response types
```typescript
// telegram-market-backend/src/types/api.ts
export interface UserResponse {
  _id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  role: UserRole;
  isBanned: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

**Frontend**: Match backend types or create mapping layer

## 🚨 Critical Issues Found

### 1. Missing Endpoint
- **Problem**: Frontend expects `/users/me` but backend doesn't have it
- **Impact**: Cannot implement real auth without this
- **Fix**: Create endpoint in Step 1

### 2. Data Structure Mismatch
- **Problem**: Backend uses `_id`, frontend expects `id`
- **Impact**: Type errors, runtime issues
- **Fix**: Transform in Step 2 or update interface in Step 3

### 3. Mock Data Still Active
- **Problem**: Production code has hardcoded mock user
- **Impact**: Security issue, wrong user shown
- **Fix**: Remove in Step 2

### 4. No Error Handling for Auth
- **Problem**: No handling for 401/403/banned states
- **Impact**: Poor UX, unclear errors
- **Fix**: Add in Step 4

### 5. Optional Username Issue
- **Problem**: Backend `username` is optional, frontend expects string
- **Impact**: Can break if user has no username
- **Fix**: Use `firstName` as fallback in Step 2

## 📋 Implementation Checklist

### Backend
- [ ] Create `src/routes/userRoutes.ts`
- [ ] Create `src/controllers/userController.ts`
- [ ] Add `getCurrentUser` controller function
- [ ] Register route in `server.ts`
- [ ] Test endpoint with Postman/curl
- [ ] Add response type definitions

### Frontend
- [ ] Remove mock data from `AuthContext.tsx`
- [ ] Add API call to `/users/me`
- [ ] Map backend response to frontend User interface
- [ ] Handle loading states
- [ ] Handle error states (401, 403, network)
- [ ] Handle no initData scenario
- [ ] Update User interface if needed
- [ ] Test in Telegram WebApp environment
- [ ] Test in browser (dev mode with mock)

### Testing
- [ ] Test with valid user
- [ ] Test with banned user
- [ ] Test with unregistered user (no invite)
- [ ] Test with no initData (browser)
- [ ] Test network errors
- [ ] Test loading states
- [ ] Verify Navbar shows/hides admin tab correctly

## 🔄 Authentication Flow (After Implementation)

```
1. User opens Telegram WebApp
   ↓
2. Telegram SDK provides initData
   ↓
3. App.tsx renders → AuthProvider mounts
   ↓
4. AuthContext useEffect runs
   ↓
5. api.get('/users/me') called
   ↓
6. api.ts interceptor attaches initData to Authorization header
   ↓
7. Backend protect middleware validates initData
   ↓
8. Backend queries/caches user from database
   ↓
9. Backend returns user data
   ↓
10. Frontend transforms and sets user state
    ↓
11. Navbar uses useAuth() → checks isAdmin → shows/hides admin tab
    ↓
12. All components can access user via useAuth() hook
```

## 🎯 Priority Order

1. **CRITICAL**: Create `/users/me` endpoint (backend) - Blocking
2. **CRITICAL**: Replace mock auth with real API call (frontend) - Security issue
3. **HIGH**: Handle error states (401/403/network) - UX issue
4. **MEDIUM**: Improve type safety - Code quality
5. **LOW**: Add firstName to frontend interface - Nice to have

## ⚠️ Important Notes

1. **initData is only available in Telegram WebApp environment**
   - Browser testing won't work without mock
   - Consider dev mode flag for browser testing

2. **User registration happens via bot, not webapp**
   - User must click invite link in bot first
   - WebApp can't register users, only authenticate existing ones

3. **Cache considerations**
   - Backend caches user for 2 minutes
   - Frontend should handle user updates (if username changes)
   - Consider cache invalidation strategy

4. **Security**
   - initData is validated server-side (HMAC)
   - Never trust client-side data
   - Always use protect middleware for protected routes

