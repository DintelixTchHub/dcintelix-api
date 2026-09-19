import { Router } from 'express';
import {
  deleteAdminTestimonial,
  getAdminTestimonial,
  getAdminTestimonials,
  getPublishedTestimonials,
  submitTestimonial,
  updateAdminTestimonial,
} from '../controllers/testimonialController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/', submitTestimonial);
router.get('/', getPublishedTestimonials);
router.get('/admin', authMiddleware, getAdminTestimonials);
router.get('/admin/:id', authMiddleware, getAdminTestimonial);
router.patch('/admin/:id', authMiddleware, updateAdminTestimonial);
router.delete('/admin/:id', authMiddleware, deleteAdminTestimonial);

export default router;
