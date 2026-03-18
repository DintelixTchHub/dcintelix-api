import { Router } from 'express';
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers,
  getSubscriberStats,
  deleteSubscriberByEmail,
  sendBulkNewsletter,
} from '../controllers/newsletterController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Subscribe to newsletter
router.post('/subscribe', subscribeNewsletter);

// Unsubscribe from newsletter
router.post('/unsubscribe', unsubscribeNewsletter);

// Get all subscribers (admin only)
router.get('/', authMiddleware, getAllSubscribers);

// Get subscriber statistics (admin only)
router.get('/stats', authMiddleware, getSubscriberStats);

// Delete subscriber (admin only)
router.delete('/:email', authMiddleware, deleteSubscriberByEmail);

// Send bulk newsletter (admin only)
router.post('/send', authMiddleware, sendBulkNewsletter);

export default router;
