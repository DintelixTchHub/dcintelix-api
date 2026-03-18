import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Register a new admin
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name }: RegisterRequest = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Admin with this email already exists',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set HTTP-only cookie for persistent session
    const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    logger.info(`New admin registered: ${admin.email}`);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          createdAt: admin.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

// Login admin
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set HTTP-only cookie for persistent session
    const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    logger.info(`Admin logged in: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

// Get current admin profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).admin?.id;

    if (!adminId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Logout admin
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the cookie
    res.clearCookie('adminToken', {
      path: '/',
    });

    logger.info('Admin logged out');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
    });
  }
};
