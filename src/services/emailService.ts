import { Resend } from 'resend';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

class EmailService {
  private resend: Resend | null;

  constructor() {
    this.resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.resend || !config.resend.apiKey) {
        logger.error('Resend API key is missing');
        return false;
      }

      logger.info('Resend configuration detected successfully');
      return true;
    } catch (error) {
      logger.error('Resend connection verification failed:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions, retryCount: number = 2): Promise<boolean> {
    if (!this.resend || !config.resend.apiKey) {
      logger.error('Resend API key is missing. Email not sent.');
      return false;
    }

    let lastError: any;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const attachments = options.attachments?.length
          ? await Promise.all(
              options.attachments.map(async (attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
              }))
            )
          : undefined;

        const emailPayload = {
          from: config.resend.from,
          to: options.to.split(',').map((email) => email.trim()).filter(Boolean),
          subject: options.subject,
          html: options.html,
          attachments,
        };

        const response = await this.resend.emails.send(emailPayload);

        if (response.error) {
          throw new Error(response.error.message || 'Resend API returned an error');
        }

        logger.info(`Email sent successfully to ${options.to}`);
        return true;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || 'Unknown error';
        const errorCode = error?.statusCode || error?.code || 'UNKNOWN';

        if (attempt < retryCount) {
          logger.warn(`Email send attempt ${attempt} failed, retrying...`, {
            message: errorMessage,
            code: errorCode,
          });
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        } else {
          logger.error(`Error sending email to ${options.to} after ${retryCount} attempts:`, {
            message: errorMessage,
            code: errorCode,
          });
        }
      }
    }

    logger.error('Email send failed with last known error:', lastError);
    return false;
  }

  async sendContactEmail(
    name: string,
    email: string,
    subject: string,
    message: string,
    phone?: string,
    attachment?: Express.Multer.File,
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #F9FAFC; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0D6D63; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #F9FAFC; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Name:</span> ${name}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${email}
            </div>
            <div class="field">
              <span class="label">Phone:</span> ${phone || 'N/A'}
            </div>
            <div class="field">
              <span class="label">Subject:</span> ${subject}
            </div>
            <div class="field">
              <span class="label">Message:</span>
              <p>${message}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: config.smtp.user, // Send to admin email
      subject: `Contact Form: ${subject}`,
      html: htmlContent,
      attachments: attachment
        ? [{ filename: attachment.originalname, content: attachment.buffer }]
        : undefined,
    });
  }

  async sendNewsletterConfirmation(email: string): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #F9FAFC; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0D6D63; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #F9FAFC; text-align: center; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0D6D63; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to DCIntelix Newsletter!</h2>
          </div>
          <div class="content">
            <p>Thank you for subscribing to our newsletter!</p>
            <p>You'll receive updates about our latest projects, blog posts, and company news.</p>
            <p>We're excited to have you as part of our community!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to DCIntelix Newsletter!',
      html: htmlContent,
    });
  }

  async sendNewsletterToAdmin(subscribedEmails: string[]): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #F9FAFC; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0D6D63; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #F9FAFC; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Newsletter Subscription</h2>
          </div>
          <div class="content">
            <p>New user subscribed to the newsletter:</p>
            <p><strong>Total subscribers:</strong> ${subscribedEmails.length}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: config.smtp.user,
      subject: 'New Newsletter Subscription',
      html: htmlContent,
    });
  }

  async sendReplyEmail(
    toEmail: string,
    name: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #F9FAFC; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0D6D63; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #F9FAFC; }
          .footer { padding: 15px; background-color: #F9FAFC; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Re: ${subject}</h2>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <br>
            <p>Best regards,<br>DCIntelix Team</p>
          </div>
          <div class="footer">
            <p>This is an automated response. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `Re: ${subject}`,
      html: htmlContent,
    });
  }

  async sendBulkNewsletter(
    emails: string[],
    subject: string,
    content: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #F9FAFC; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0D6D63; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #F9FAFC; }
          .footer { padding: 15px; background-color: #F9FAFC; text-align: center; font-size: 12px; color: #666; }
          .unsubscribe { color: #0D6D63; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subject}</h2>
          </div>
          <div class="content">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>You received this email because you subscribed to DCIntelix newsletter.</p>
            <p><a href="https://dcintelix.com/newsletter/unsubscribe" class="unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    for (const email of emails) {
      try {
        const result = await this.sendEmail({
          to: email,
          subject: subject,
          html: htmlContent,
        });
        if (result) {
          success++;
        } else {
          failed++;
        }
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to send newsletter to ${email}:`, error);
        failed++;
      }
    }

    logger.info(`Bulk newsletter sent: ${success} success, ${failed} failed`);
    return { success, failed };
  }
}

export const emailService = new EmailService();
