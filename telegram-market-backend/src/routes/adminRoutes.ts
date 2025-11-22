import express from 'express';
import { generateInvite } from '../controllers/adminController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/roles';
import { UserRole } from '../models/User';

const router = express.Router();

// Endpoint: POST /api/admin/invite
// Security: Protect (Valid Token) + Authorize (Must be Admin or Super Admin)
router.post(
  '/invite', 
  protect, 
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), 
  generateInvite
);

export default router;