import { prisma } from '../config/database';
import { Newsletter } from '@prisma/client';

export interface INewsletterInput {
  email: string;
  isActive?: boolean;
  subscribedAt?: Date;
  unsubscribedAt?: Date | null;
}

// Create a new newsletter subscription
export const createNewsletterRecord = async (data: INewsletterInput): Promise<Newsletter> => {
  return await prisma.newsletter.create({
    data: {
      email: data.email,
      isActive: data.isActive || true,
      subscribedAt: data.subscribedAt || new Date(),
      unsubscribedAt: data.unsubscribedAt || null,
    },
  });
};

// Find newsletter by email
export const findNewsletterByEmail = async (email: string): Promise<Newsletter | null> => {
  return await prisma.newsletter.findUnique({
    where: { email },
  });
};

// Get all active subscribers with pagination
export const findActiveSubscribers = async (skip: number, limit: number): Promise<[Newsletter[], number]> => {
  const subscribers = await prisma.newsletter.findMany({
    where: { isActive: true },
    orderBy: { subscribedAt: 'desc' },
    skip,
    take: limit,
  });
  
  const total = await prisma.newsletter.count({
    where: { isActive: true },
  });
  
  return [subscribers, total];
};

// Get subscriber count
export const countSubscribers = async (isActive: boolean): Promise<number> => {
  return await prisma.newsletter.count({
    where: { isActive },
  });
};

// Reactivate subscription
export const reactivateSubscription = async (email: string): Promise<Newsletter> => {
  return await prisma.newsletter.update({
    where: { email },
    data: {
      isActive: true,
      subscribedAt: new Date(),
      unsubscribedAt: null,
    },
  });
};

// Unsubscribe
export const unsubscribeUser = async (email: string): Promise<Newsletter> => {
  return await prisma.newsletter.update({
    where: { email },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });
};

// Delete subscriber completely
export const deleteSubscriber = async (email: string): Promise<Newsletter | null> => {
  return await prisma.newsletter.delete({
    where: { email },
  }).catch(() => null);
};

// Get all subscribers (including inactive) with pagination
export const findAllSubscribers = async (skip: number, limit: number): Promise<[Newsletter[], number]> => {
  const subscribers = await prisma.newsletter.findMany({
    orderBy: { subscribedAt: 'desc' },
    skip,
    take: limit,
  });
  
  const total = await prisma.newsletter.count();
  
  return [subscribers, total];
};

// Get all active subscriber emails
export const findAllActiveEmails = async (): Promise<string[]> => {
  const subscribers = await prisma.newsletter.findMany({
    where: { isActive: true },
    select: { email: true },
  });
  return subscribers.map(s => s.email);
};

// Export Newsletter model type for compatibility
export { Newsletter };
