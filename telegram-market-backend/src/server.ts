/// <reference path="./types/express.d.ts" />
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import bot from './bot';
import { protect } from './middlewares/auth';
import { authorize } from './middlewares/roles';
import { UserRole } from './models/User';
import adminRoutes from './routes/adminRoutes';
import { generateInvite } from './controllers/adminController';
import productRoutes from './routes/productRoutes';
import { submitProduct } from './controllers/productController'; 

// Load Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
// app.use(helmet()); // Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: process.env.CORS_ORIGIN })); // Allow frontend access
app.use(express.json()); // Parse JSON bodies

// Basic Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.send({ status: 'Active', message: 'Telegram Market Backend is Running' });
});

// Test Route 1: For any logged-in user
app.get('/api/me', protect, (req: Request, res: Response) => {
  res.json({ 
    message: 'You are authenticated', 
    user: req.user 
  });
});

// Test Route 2: For Admins only
app.get('/api/admin-data', protect, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome Admin', 
    secretData: 'Users cannot see this' 
  });
});

app.use('/api/admin', adminRoutes);


app.post('/test-invite', (req: any, res: any) => {
  req.user = { _id: '691ecc5c5a8edb94077a93a9', role: 'SUPER_ADMIN' }; 
  // You can get your _id from MongoDB Compass
  // Set default body if not provided
  if (!req.body) {
    req.body = {};
  }
  // Default role to USER if not provided
  if (!req.body.role) {
    req.body.role = 'USER';
  }
  return generateInvite(req, res);
});

app.use('/api/products', productRoutes);

app.post('/test-submit', (req: any, res: any) => {
  // Mock a Seller User
  req.user = { 
      _id: '691f4f9d228b7102a87d95a7', // Put a valid User ID here (not the Super Admin ID, create a second user!)
      username: 'TestSeller', 
      role: 'USER' 
  };
  req.body = {
      title: 'Gaming Laptop',
      originalPrice: 1200,
      description: 'Used for 2 months',
      mediaFileId: null // Leave null for now
  };
  return submitProduct(req, res);
});
// Start the Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start the Telegram Bot (Polling mode for development)
  // In production, you might use Webhooks, but polling is easier for dev.
  bot.launch().then(() => {
    console.log('🤖 Telegram Bot started');
  }).catch((err) => {
    console.error('Bot launch failed:', err);
  });
});