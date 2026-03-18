import { Request, Response } from 'express';
import { createNewsletterRecord, findNewsletterByEmail, findActiveSubscribers, findAllSubscribers, countSubscribers, reactivateSubscription, unsubscribeUser, deleteSubscriber as deleteSubscriberModel, findAllActiveEmails } from '../helper/newsletterModel';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

export interface NewsletterRequestBody {
  email: string;
}

export const subscribeNewsletter = async (
  req: Request<{}, {}, NewsletterRequestBody>,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      throw createError('Email is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Please provide a valid email address', 400);
    }

    // Check if already subscribed
    const existingSubscriber = await findNewsletterByEmail(email.toLowerCase());

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        throw createError('This email is already subscribed to our newsletter', 400);
      } else {
        // Reactivate subscription
        await reactivateSubscription(email.toLowerCase());
        
        logger.info(`Newsletter reactivated for: ${email}`);
      }
    } else {
      // Create new subscription
      await createNewsletterRecord({
        email: email.toLowerCase(),
      });
      logger.info(`New newsletter subscription: ${email}`);
    }

    // Send confirmation email
    await emailService.sendNewsletterConfirmation(email);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to our newsletter!',
    });
  } catch (error) {
    next(error);
  }
};

export const unsubscribeNewsletter = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw createError('Email is required', 400);
    }

    const subscriber = await findNewsletterByEmail(email.toLowerCase());

    if (!subscriber) {
      throw createError('This email is not subscribed to our newsletter', 404);
    }

    await unsubscribeUser(email.toLowerCase());

    logger.info(`Newsletter unsubscribed: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from our newsletter',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSubscribers = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [subscribers, total] = await findActiveSubscribers(skip, limit);

    res.status(200).json({
      success: true,
      data: subscribers,
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

export const getSubscriberStats = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const totalSubscribers = await countSubscribers(true);
    const totalUnsubscribed = await countSubscribers(false);

    res.status(200).json({
      success: true,
      data: {
        active: totalSubscribers,
        unsubscribed: totalUnsubscribed,
        total: totalSubscribers + totalUnsubscribed,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscriberByEmail = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const emailParam = req.params.email as string;

    const subscriber = await findNewsletterByEmail(emailParam.toLowerCase());

    if (!subscriber) {
      throw createError('Subscriber not found', 404);
    }

    await deleteSubscriberModel(emailParam.toLowerCase());

    logger.info(`Subscriber deleted: ${emailParam}`);

    res.status(200).json({
      success: true,
      message: 'Subscriber deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const sendBulkNewsletter = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      throw createError('Subject and content are required', 400);
    }

    const emails = await findAllActiveEmails();

    if (emails.length === 0) {
      throw createError('No active subscribers found', 404);
    }

    const result = await emailService.sendBulkNewsletter(emails, subject, content);

    logger.info(`Bulk newsletter sent: ${result.success} success, ${result.failed} failed`);

    res.status(200).json({
      success: true,
      message: `Newsletter sent to ${result.success} subscribers. ${result.failed} failed.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
