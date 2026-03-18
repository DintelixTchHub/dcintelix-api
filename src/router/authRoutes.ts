import { Router, Request, Response } from 'express';
import { register, login, getProfile, logout } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authMiddleware, getProfile);

export default router;
