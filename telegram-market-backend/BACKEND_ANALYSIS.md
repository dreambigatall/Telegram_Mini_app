# Telegram Market Backend - Complete Analysis

## 📋 Overview

This is a **Telegram Mini App marketplace backend** built with **Express.js** and **TypeScript**. It facilitates a product marketplace where users can submit products for sale, which are reviewed and published by admins. The system integrates seamlessly with Telegram's authentication and bot API.

---

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Telegram Web App Data validation
- **Bot Framework**: Telegraf v4.16.3
- **Validation**: Zod v4.1.12
- **Caching**: node-cache v5.1.2
- **Logging**: Winston v3.18.3
- **Security**: Helmet, CORS, express-rate-limit

### Project Structure
```
src/
├── bot.ts                 # Telegram bot handlers
├── server.ts              # Express app entry point
├── config/                # Database & env config
├── controllers/           # Request handlers
├── models/                # Mongoose schemas
├── routes/                # API route definitions
├── services/              # Business logic layer
├── middlewares/           # Auth, validation, error handling
├── validations/           # Zod schemas
├── utils/                 # Helpers (cache, logger, response)
└── types/                 # TypeScript type definitions
```

---

## 🔐 Authentication & Authorization

### Authentication Method
- **Telegram Web App Data**: Uses Telegram's `initData` passed via `Authorization` header
- **Validation**: HMAC-SHA256 signature verification against BOT_TOKEN
- **No JWT/Sessions**: Stateless authentication per request

### User Roles
1. **SUPER_ADMIN**: Full access, can create ADMIN invites
2. **ADMIN**: Can approve/reject products, generate USER invites
3. **USER**: Can submit products and view published feed

### Access Control Flow
```
Request → protect middleware → validateTelegramData() → 
Find/Create User → Check banned status → Attach to req.user → 
authorize() middleware → Check role → Route handler
```

---

## 📡 API Endpoints

### Base URL: `/api`

### 1. Health Check Routes (`/health`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Basic health check |
| GET | `/health/detailed` | ❌ | System status (DB, memory, cache) |
| GET | `/health/metrics` | ❌ | Prometheus-style metrics |

### 2. User Routes (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | ✅ USER+ | Get current authenticated user profile |

### 3. Product Routes (`/api/products`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | USER+ | Submit new product for review |
| GET | `/feed` | ✅ | USER+ | Get published products (paginated) |
| GET | `/image/:fileId` | ❌ | - | Proxy Telegram file (image/video) |
| GET | `/pending` | ✅ | ADMIN+ | Get pending products (admin dashboard) |
| PATCH | `/:id/approve` | ✅ | ADMIN+ | Approve & publish product |
| PATCH | `/:id/reject` | ✅ | ADMIN+ | Reject product with reason |

### 4. Admin Routes (`/api/admin`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/invite` | ✅ | ADMIN+ | Generate invite code/link |

---

## 📊 Data Models

### 1. User Model
```typescript
{
  telegramId: string (unique, indexed)
  username?: string
  firstName?: string
  role: UserRole (USER | ADMIN | SUPER_ADMIN)
  isBanned: boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

### 2. Product Model
```typescript
{
  seller: ObjectId (ref: User, HIDDEN from API)
  title: string (required)
  description?: string
  originalPrice: number (required)
  mediaFileId?: string (Telegram File ID)
  status: ProductStatus (PENDING | PUBLISHED | SOLD | REJECTED)
  
  // Admin fields (added on approval)
  approvedBy?: ObjectId (ref: User)
  finalPrice?: number
  adminContact?: {
    username: string
    phoneNumber: string
  }
  
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**:
- `status + createdAt` (for pending queue)
- `status + updatedAt` (for published feed)
- `seller + status` (for user's products)

### 3. Invite Model
```typescript
{
  code: string (unique, indexed) // e.g., "invite-55a-bc2"
  roleToAssign: UserRole (USER | ADMIN)
  createdBy: ObjectId (ref: User)
  isUsed: boolean (default: false, indexed)
  usedBy?: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔄 Business Logic Flows

### 1. User Registration Flow
```
User clicks invite link → /start command in bot → 
Extract invite code → Validate code → Create User → 
Mark invite as used → Send welcome message
```

### 2. Product Submission Flow
```
USER submits product via POST /api/products → 
Validation (Zod) → Create product (status: PENDING) → 
Clear pending cache → Notify admin via Telegram → 
Return product ID
```

### 3. Product Approval Flow
```
ADMIN views pending products → Selects product → 
Approves with admin contact info → 
Update product (status: PUBLISHED, add adminContact) → 
Clear all product caches → Notify seller via Telegram → 
Product now visible in public feed
```

### 4. Product Rejection Flow
```
ADMIN rejects product → Update status to REJECTED → 
Clear caches → Notify seller with reason → 
Product hidden from all feeds
```

---

## 🛡️ Security Features

### 1. Rate Limiting
- **100 requests per 15 minutes** per IP
- Applied to all `/api/*` routes
- Configurable via `express-rate-limit`

### 2. Request Security
- **Helmet.js**: Security headers
- **CORS**: Origin restriction via `CORS_ORIGIN` env var
- **Body Parser**: 10MB limit for JSON

### 3. Data Validation
- **Zod schemas** for all input validation
- Type-safe request/response handling
- Automatic error responses for invalid data

### 4. Authentication Security
- HMAC-SHA256 signature verification
- Telegram data integrity check
- No sensitive data in tokens

### 5. Error Handling
- Centralized error handler middleware
- Structured error responses
- Detailed logging (Winston)

---

## 🚀 Performance Optimizations

### 1. Caching Strategy
- **Node-cache** with 5-minute default TTL
- **Cached Endpoints**:
  - User data (2 min TTL)
  - Product feed (5 min TTL)
  - Pending products (2 min TTL)
- **Cache Invalidation**: Automatic on product updates

### 2. Database Optimizations
- **Compound indexes** on frequent queries
- **Lean queries** for read-only operations
- **Selective field projection** (`-seller`, `-__v`)

### 3. Query Optimization
- **Pagination** on all list endpoints
- **Parallel queries** using `Promise.all()`
- **Population** only when needed

---

## 🤖 Telegram Bot Integration

### Bot Features

1. **User Registration** (`/start`)
   - Handles invite code validation
   - Creates user accounts
   - Assigns roles based on invite

2. **Media Helper**
   - Users send photos to bot
   - Bot replies with Telegram File ID
   - Users paste ID into web app form

3. **Notifications**
   - Admin notifications (new submissions)
   - Seller notifications (approval/rejection)

### Bot Commands
| Command | Description |
|---------|-------------|
| `/start <invite_code>` | Register new user or welcome existing |

---

## 📦 API Request/Response Examples

### Submit Product
```http
POST /api/products
Authorization: <telegram_initData>

{
  "title": "Vintage Watch",
  "description": "Beautiful vintage watch",
  "originalPrice": 150,
  "mediaFileId": "AgACAgIAAxkBAA..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Vintage Watch",
    "status": "PENDING",
    ...
  },
  "message": "Item submitted for review"
}
```

### Get Product Feed
```http
GET /api/products/feed?page=1&limit=20
Authorization: <telegram_initData>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Product Name",
      "finalPrice": 150,
      "adminContact": {
        "username": "@admin",
        "phoneNumber": "+1234567890"
      },
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Approve Product
```http
PATCH /api/products/:id/approve
Authorization: <telegram_initData>

{
  "finalPrice": 150,
  "adminUsername": "@admin",
  "adminPhone": "+1234567890"
}
```

---

## 🔍 Key Design Patterns

### 1. Service Layer Pattern
- **Controllers** handle HTTP concerns
- **Services** contain business logic
- **Models** define data structure

### 2. Middleware Chain
```
Request → Security → Rate Limit → Logging → 
Auth → Authorization → Validation → Controller → 
Response/Error
```

### 3. Dependency Injection
- Services are static classes
- Utilities are singleton modules
- Easy to mock for testing

### 4. Cache-aside Pattern
```
Check cache → Cache hit? Return → 
Cache miss? Query DB → Store in cache → Return
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `BOT_TOKEN` | ✅ | Telegram bot token |
| `PORT` | ✅ | Server port (default: 5000) |
| `CORS_ORIGIN` | ❌ | Allowed CORS origin |
| `SUPER_ADMIN_ID` | ❌ | Telegram ID for admin notifications |
| `BOT_USERNAME` | ❌ | Bot username for invite links |
| `NODE_ENV` | ❌ | Environment (development/production) |

---

## 🎯 Notable Features

### 1. **Privacy Protection**
- Seller information (`seller` field) is **hidden** from public API
- Buyers contact admins, not sellers directly
- Admin acts as intermediary

### 2. **Invite-Only System**
- Controlled user growth
- Role assignment via invites
- Deep link integration (`https://t.me/bot?start=code`)

### 3. **Admin Price Adjustment**
- Admins can modify prices during approval
- `originalPrice` vs `finalPrice` tracking
- Transparency in pricing changes

### 4. **Graceful Shutdown**
- Handles SIGTERM/SIGINT
- Closes DB connections
- Stops bot gracefully
- Clears cache

### 5. **Comprehensive Logging**
- Structured logs with Winston
- Request logging in development
- Error tracking
- Cache operation logs

---

## 🔧 Code Quality Highlights

### Strengths
✅ **Type Safety**: Full TypeScript implementation  
✅ **Validation**: Zod schemas for all inputs  
✅ **Error Handling**: Centralized error middleware  
✅ **Security**: Rate limiting, CORS, Helmet  
✅ **Performance**: Caching, indexes, lean queries  
✅ **Documentation**: Clear code structure  
✅ **Scalability**: Service layer pattern  

### Areas for Improvement
⚠️ **Testing**: No test files found  
⚠️ **API Documentation**: No Swagger/OpenAPI  
⚠️ **Monitoring**: Basic metrics only  
⚠️ **Validation**: Some fields could be more strict  

---

## 📈 Scalability Considerations

### Current Limitations
- In-memory cache (node-cache) - won't scale across instances
- Single MongoDB instance
- No load balancing configuration

### Recommended Improvements
1. **Redis** for distributed caching
2. **MongoDB Replica Set** for high availability
3. **API Gateway** for rate limiting across instances
4. **Background Jobs** for notifications (Bull/BullMQ)
5. **CDN** for serving media files

---

## 🎓 Conclusion

This backend is **well-structured** with clear separation of concerns, solid security practices, and good performance optimizations. It effectively handles the core marketplace workflow with Telegram integration. The codebase follows TypeScript best practices and uses modern Express.js patterns.

**Key Strengths**: Security, Type safety, Caching, Telegram integration  
**Key Improvements**: Testing, Documentation, Distributed caching

---

*Last Updated: Generated from codebase analysis*

