import dotenv from 'dotenv';
import { SignOptions } from 'jsonwebtoken';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dcintelix?schema=public',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@dcintelix.com',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@dcintelix.com',
  },
  r2: {
    accountId: process.env.CF_ACCOUNT_ID || '',
    accessKeyId: process.env.CF_ACCESS_KEY || '',
    secretAccessKey: process.env.CF_SECRET_KEY || '',
    bucket: process.env.CF_R2_BUCKET || '',
    endpoint: process.env.CF_R2_ENDPOINT || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'dcintelix-jwt-secret-key-2024',
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'],
  },
};
