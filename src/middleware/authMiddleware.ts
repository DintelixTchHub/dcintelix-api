import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from cookie or header
    let token = req.cookies?.adminToken;
    
    // Fallback to Authorization header if cookie not present
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
    };

    // Add admin to request
    req.admin = decoded;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
