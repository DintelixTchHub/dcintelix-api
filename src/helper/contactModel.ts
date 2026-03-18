import { prisma } from '../config/database';
import { Contact } from '@prisma/client';

export interface IContactInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachment?: string;
  isRead?: boolean;
}

// Create a new contact
export const createContactRecord = async (data: IContactInput): Promise<Contact> => {
  return await prisma.contact.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      attachment: data.attachment || null,
      isRead: data.isRead || false,
    },
  });
};

// Get all contacts with pagination
export const findAllContacts = async (skip: number, limit: number): Promise<[Contact[], number]> => {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });
  
  const total = await prisma.contact.count();
  
  return [contacts, total];
};

// Get contact by ID
export const findContactById = async (id: string): Promise<Contact | null> => {
  return await prisma.contact.findUnique({
    where: { id },
  });
};

// Mark contact as read
export const updateContactAsRead = async (id: string): Promise<Contact> => {
  return await prisma.contact.update({
    where: { id },
    data: { isRead: true },
  });
};

// Delete contact
export const removeContact = async (id: string): Promise<Contact> => {
  return await prisma.contact.delete({
    where: { id },
  });
};

// Export Contact model type for compatibility
export { Contact };
