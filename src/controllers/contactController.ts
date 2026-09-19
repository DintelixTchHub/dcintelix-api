import { Request, Response } from 'express';
import { createContactRecord, findAllContacts, findContactById, removeContact, updateContactAsRead } from '../helper/contactModel';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { createTestimonialRecord } from '../helper/testimonialModel';
import { deletePrivateFile, getPrivateFileUrl, uploadPrivateFile } from '../services/r2Service';
import { randomUUID } from 'crypto';
import path from 'path';

export interface ContactRequestBody {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactRequest extends Request<{}, {}, ContactRequestBody> {
  file?: Express.Multer.File;
}

export const submitContact = async (
  req: ContactRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw createError('Please provide all required fields', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Please provide a valid email address', 400);
    }

    if (subject.trim().toLowerCase() === 'testimonial') {
      const roleMatch = message.match(/\n\nRole or organization:\s*(.*)$/s);
      const testimonial = roleMatch ? message.slice(0, roleMatch.index).trim() : message.trim();
      const role = roleMatch?.[1] === 'Not provided' ? undefined : roleMatch?.[1]?.trim();
      if (testimonial.length < 20) {
        throw createError('Testimonial must be at least 20 characters', 400);
      }
      const record = await createTestimonialRecord({ name, email, role, testimonial });
      logger.info(`New testimonial submitted: ${record.id}`);
      res.status(201).json({
        success: true,
        message: 'Thank you for sharing your testimonial. We will review it before publishing.',
        data: { id: record.id, name: record.name, email: record.email },
      });
      return;
    }

    const file = req.file;
    const attachmentKey = file
      ? `contact-attachments/${new Date().getUTCFullYear()}/${randomUUID()}${path.extname(file.originalname).toLowerCase()}`
      : undefined;

    try {
      if (file && attachmentKey) await uploadPrivateFile(file, attachmentKey);

      const contact = await createContactRecord({
        name,
        email,
        phone,
        subject,
        message,
        attachment: attachmentKey,
      });

      logger.info(`New contact saved: ${contact.id}`);

      const emailSent = await emailService.sendContactEmail(
        name,
        email,
        subject,
        message,
        phone,
        file,
      );

      if (!emailSent) {
        logger.warn('Failed to send contact email notification');
      }

      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
        data: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
        },
      });
    } catch (error) {
      if (attachmentKey) await deletePrivateFile(attachmentKey).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const getAllContacts = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [contacts, total] = await findAllContacts(skip, limit);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const contactId = req.params.id as string;
    const contact = await findContactById(contactId);

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    // Mark as read if not already read
    if (!contact.isRead) {
      await updateContactAsRead(contactId);
      contact.isRead = true;
    }

    const attachmentUrl = contact.attachment
      ? await getPrivateFileUrl(contact.attachment)
      : undefined;

    res.status(200).json({
      success: true,
      data: { ...contact, attachmentUrl },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const contactId = req.params.id as string;
    const contact = await findContactById(contactId);

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    await removeContact(contactId);
    if (contact.attachment) {
      await deletePrivateFile(contact.attachment).catch((error) => {
        logger.warn(`Failed to delete contact attachment for ${contactId}`, error);
      });
    }

    logger.info(`Contact deleted: ${contactId}`);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const replyToContact = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const contactId = req.params.id as string;
    const { subject, message } = req.body;

    if (!subject || !message) {
      throw createError('Subject and message are required', 400);
    }

    const contact = await findContactById(contactId);

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    // Send reply email
    const emailSent = await emailService.sendReplyEmail(
      contact.email,
      contact.name,
      subject,
      message
    );

    if (!emailSent) {
      throw createError('Failed to send reply email', 500);
    }

    logger.info(`Reply sent to contact: ${contactId}`);

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
    });
  } catch (error) {
    next(error);
  }
};
