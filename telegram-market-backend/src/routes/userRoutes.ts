import express from 'express';
import { getCurrentUser } from '../controllers/userController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// GET /api/users/me - Get current authenticated user
// Protected route - requires valid Telegram initData in Authorization header
router.get('/me', protect, getCurrentUser);

export default router;

