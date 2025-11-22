import express from 'express';
import { generateInvite } from '../controllers/adminController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/roles';
import { validate } from '../middlewares/validate';
import { generateInviteSchema } from '../validations/inviteValidation';
import { UserRole } from '../models/User';

const router = express.Router();

router.post(
  '/invite', 
  protect, 
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(generateInviteSchema),
  generateInvite
);

export default router;