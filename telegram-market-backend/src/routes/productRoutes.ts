import express from 'express';
import { 
  submitProduct, 
  getPendingProducts, 
  approveProduct, 
  rejectProduct,
  getPublicFeed,
  getProductImage,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/roles';
import { validate } from '../middlewares/validate';
import { 
  submitProductSchema, 
  approveProductSchema, 
  rejectProductSchema,
  updateProductSchema
} from '../validations/productValidation';
import { UserRole } from '../models/User';

const router = express.Router();

// User Routes
router.post('/', protect, validate(submitProductSchema), submitProduct);
router.get('/feed', protect, getPublicFeed);
router.get('/image/:fileId', getProductImage);

// Admin Routes
router.get(
  '/pending', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), 
  getPendingProducts
);

router.patch(
  '/:id/approve', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(approveProductSchema),
  approveProduct
);

router.patch(
  '/:id/reject', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(rejectProductSchema),
  rejectProduct
);

// Admin & Super Admin Routes - Update and Delete Published Products
router.patch(
  '/:id',
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  deleteProduct
);

export default router;