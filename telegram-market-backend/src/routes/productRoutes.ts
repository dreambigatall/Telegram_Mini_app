import express from 'express';
import { 
  submitProduct, 
  getPendingProducts, 
  approveProduct, 
  rejectProduct,
  getPublicFeed,
  getProductImage,
  getProductById,
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
router.post('/', protect, authorize(UserRole.SELLER, UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(submitProductSchema), submitProduct);
router.get('/feed', protect, authorize(UserRole.BUYER, UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN), getPublicFeed);
router.get('/image/:fileId', getProductImage);

// Admin Routes - Must be before /:id route
router.get(
  '/pending', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), 
  getPendingProducts
);

// Dynamic routes - Must be last
router.get('/:id', protect, authorize(UserRole.BUYER, UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN), getProductById);

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