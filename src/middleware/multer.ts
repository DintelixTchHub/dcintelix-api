import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - using any for file to avoid type conflicts with multer types
const fileFilter = (req: Request | any, file: any, cb: FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only images and documents are allowed'));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

// Error handler for multer
export const handleMulterError = (err: Error, req: Request, res: Response, next: Function): void => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    logger.error('File upload error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  } else {
    next();
  }
};
