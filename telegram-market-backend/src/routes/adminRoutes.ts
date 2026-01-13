import express from 'express';
import { 
  generateInvite,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/adminController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/roles';
import { validate } from '../middlewares/validate';
import { generateInviteSchema } from '../validations/inviteValidation';
import { updateUserSchema } from '../validations/userValidation';
import { UserRole } from '../models/User';

const router = express.Router();

router.post(
  '/invite', 
  protect, 
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(generateInviteSchema),
  generateInvite
);

// Super Admin Only Routes - User Management
router.get(
  '/users',
  protect,
  authorize(UserRole.SUPER_ADMIN),
  getAllUsers
);

router.patch(
  '/users/:id',
  protect,
  authorize(UserRole.SUPER_ADMIN),
  validate(updateUserSchema),
  updateUser
);

router.delete(
  '/users/:id',
  protect,
  authorize(UserRole.SUPER_ADMIN),
  deleteUser
);

export default router;