import { Router } from 'express';
import {
  submitContact,
  getAllContacts,
  getContactById,
  deleteContact,
  replyToContact,
} from '../controllers/contactController';
import { upload } from '../middleware/multer';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Submit a new contact form - eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', submitContact);

// Get all contacts (with pagination) - admin only
router.get('/', authMiddleware, getAllContacts);

// Get a single contact by ID - admin only
router.get('/:id', authMiddleware, getContactById);

// Delete a contact - admin only
router.delete('/:id', authMiddleware, deleteContact);

// Reply to a contact - admin only
router.post('/:id/reply', authMiddleware, replyToContact);

export default router;
