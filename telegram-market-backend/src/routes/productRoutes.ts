// import express from 'express';
// import { submitProduct } from '../controllers/productController';
// import { protect } from '../middlewares/auth';

// const router = express.Router();

// // Apply 'protect' middleware so only logged-in users can access
// router.post('/', protect, submitProduct);

// export default router;

import express from 'express';
import { 
  submitProduct, 
  getPendingProducts, 
  approveProduct, 
  rejectProduct ,
  getPublicFeed,
  getProductImage
} from '../controllers/productController';
import { protect } from '../middlewares/auth';
import { authorize } from '../middlewares/roles';
import { UserRole } from '../models/User';

const router = express.Router();

// Public/User Routes
router.post('/', protect, submitProduct);

// Admin Routes
// 1. Get Pending List
router.get(
  '/pending', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), 
  getPendingProducts
);

// 2. Approve Item
router.patch(
  '/:id/approve', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), 
  approveProduct
);

// 3. Reject Item
router.patch(
  '/:id/reject', 
  protect, 
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), 
  rejectProduct
);

router.get('/feed', protect, getPublicFeed);

router.get('/image/:fileId', getProductImage);

export default router;