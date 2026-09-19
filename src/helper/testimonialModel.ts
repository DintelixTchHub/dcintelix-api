import { prisma } from '../config/database';
import { Testimonial, TestimonialStatus } from '@prisma/client';

export interface ITestimonialInput {
  name: string;
  email: string;
  role?: string;
  testimonial: string;
}

export interface ITestimonialUpdate {
  name?: string;
  email?: string;
  role?: string | null;
  testimonial?: string;
  status?: TestimonialStatus;
  adminNote?: string | null;
  approvedAt?: Date | null;
}

export const createTestimonialRecord = async (data: ITestimonialInput): Promise<Testimonial> => {
  return prisma.testimonial.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role || null,
      testimonial: data.testimonial,
    },
  });
};

export const findApprovedTestimonials = async () => {
  return prisma.testimonial.findMany({
    where: { status: TestimonialStatus.APPROVED },
    orderBy: { approvedAt: 'desc' },
    select: {
      id: true,
      name: true,
      role: true,
      testimonial: true,
      approvedAt: true,
    },
  });
};

export const findAllTestimonials = async (skip: number, limit: number, status?: TestimonialStatus): Promise<[Testimonial[], number]> => {
  const where = status ? { status } : {};
  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.testimonial.count({ where }),
  ]);
  return [testimonials, total];
};

export const findTestimonialById = async (id: string): Promise<Testimonial | null> => {
  return prisma.testimonial.findUnique({ where: { id } });
};

export const updateTestimonialRecord = async (id: string, data: ITestimonialUpdate): Promise<Testimonial> => {
  return prisma.testimonial.update({ where: { id }, data });
};

export const removeTestimonial = async (id: string): Promise<Testimonial> => {
  return prisma.testimonial.delete({ where: { id } });
};
