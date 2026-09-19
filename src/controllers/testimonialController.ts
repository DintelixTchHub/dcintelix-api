import { Request, Response, NextFunction } from 'express';
import { TestimonialStatus } from '@prisma/client';
import {
  createTestimonialRecord,
  findAllTestimonials,
  findApprovedTestimonials,
  findTestimonialById,
  removeTestimonial,
  updateTestimonialRecord,
} from '../helper/testimonialModel';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface TestimonialRequestBody {
  name?: string;
  email?: string;
  role?: string;
  testimonial?: string;
  message?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSubmission = (body: TestimonialRequestBody) => {
  const testimonial = body.testimonial || body.message;
  if (!body.name || !body.email || !testimonial) {
    throw createError('Name, email, and testimonial are required', 400);
  }
  if (!emailRegex.test(body.email)) {
    throw createError('Please provide a valid email address', 400);
  }
  if (testimonial.trim().length < 20) {
    throw createError('Testimonial must be at least 20 characters', 400);
  }
  return {
    name: body.name.trim(),
    email: body.email.trim(),
    role: body.role?.trim(),
    testimonial: testimonial.trim(),
  };
};

export const submitTestimonial = async (
  req: Request<{}, {}, TestimonialRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const testimonial = await createTestimonialRecord(validateSubmission(req.body));
    logger.info(`New testimonial submitted: ${testimonial.id}`);
    res.status(201).json({
      success: true,
      message: 'Thank you for sharing your testimonial. We will review it before publishing.',
      data: { id: testimonial.id, name: testimonial.name, email: testimonial.email },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublishedTestimonials = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testimonials = await findApprovedTestimonials();
    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    next(error);
  }
};

export const getAdminTestimonials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const requestedStatus = req.query.status as string | undefined;
    const status = requestedStatus && Object.values(TestimonialStatus).includes(requestedStatus as TestimonialStatus)
      ? requestedStatus as TestimonialStatus
      : undefined;
    if (requestedStatus && !status) throw createError('Invalid testimonial status', 400);
    const [testimonials, total] = await findAllTestimonials((page - 1) * limit, limit, status);
    res.status(200).json({
      success: true,
      data: testimonials,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testimonial = await findTestimonialById(req.params.id);
    if (!testimonial) throw createError('Testimonial not found', 404);
    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    next(error);
  }
};

export const updateAdminTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await findTestimonialById(req.params.id);
    if (!existing) throw createError('Testimonial not found', 404);
    const { name, email, role, testimonial, status, adminNote } = req.body;
    if (email !== undefined && !emailRegex.test(email)) throw createError('Please provide a valid email address', 400);
    if (testimonial !== undefined && testimonial.trim().length < 20) throw createError('Testimonial must be at least 20 characters', 400);
    if (status !== undefined && !Object.values(TestimonialStatus).includes(status)) throw createError('Invalid testimonial status', 400);
    const updated = await updateTestimonialRecord(req.params.id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.trim() }),
      ...(role !== undefined && { role: role?.trim() || null }),
      ...(testimonial !== undefined && { testimonial: testimonial.trim() }),
      ...(status !== undefined && { status }),
      ...(adminNote !== undefined && { adminNote: adminNote?.trim() || null }),
      ...(status === TestimonialStatus.APPROVED && { approvedAt: new Date() }),
      ...(status !== undefined && status !== TestimonialStatus.APPROVED && { approvedAt: null }),
    });
    res.status(200).json({ success: true, message: 'Testimonial updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!await findTestimonialById(req.params.id)) throw createError('Testimonial not found', 404);
    await removeTestimonial(req.params.id);
    logger.info(`Testimonial deleted: ${req.params.id}`);
    res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    next(error);
  }
};
