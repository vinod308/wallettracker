/**
 * Email Service
 * Handles all email communications
 * Uses exact email templates from specification
 */

const nodemailer = require('nodemailer');
const config = require('../config/environment');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        // Create SMTP transporter only if config is provided
        try {
            if (config.SMTP_HOST && config.SMTP_USER) {
                this.transporter = nodemailer.createTransport({
                    host: config.SMTP_HOST,
                    port: config.SMTP_PORT,
                    secure: config.SMTP_SECURE,
                    auth: {
                        user: config.SMTP_USER,
                        pass: config.SMTP_PASSWORD,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                });
                logger.info('Email service initialized successfully');
                // Verify SMTP connection at startup
                this.transporter.verify((err) => {
                    if (err) {
                        logger.error(`SMTP connection verify failed: ${err.message}`);
                    } else {
                        logger.info('SMTP connection verified — ready to send emails');
                    }
                });
            } else {
                logger.warn('SMTP not configured - email features disabled');
                this.transporter = null;
            }
        } catch (error) {
            logger.error('Failed to initialize email service:', error);
            this.transporter = null;
        }
    }

    /**
     * Send Password Reset Email
     * Exact format from specification (section 2.3.4)
     * @param {object} user
     * @param {string} token
     */
    async sendPasswordResetEmail(user, token) {
        const resetLink = `${config.CORS_ORIGIN}/reset-password?token=${token}`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1F4788; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 30px; background: #1F4788; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your GarageWallet Password</h1>
        </div>
        <div class="content">
            <p>Hello ${user.full_name},</p>
            <p>We received a request to reset your password for your GarageWallet account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1F4788;">${resetLink}</p>
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This link expires in 1 hour</li>
                    <li>This link can only be used once</li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
            </div>
            <p>For security reasons, this password reset link will expire in <strong>1 hour</strong>.</p>
            <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Garage Collective. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: config.EMAIL_FROM,
            to: user.email,
            subject: 'Reset Your GarageWallet Password',
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to: ${user.email}`);
        } catch (error) {
            logger.error('Error sending password reset email:', error);
            // Don't throw error to avoid revealing email delivery issues
        }
    }

    /**
     * Send Welcome Email (after signup)
     * @param {object} user
     */
    async sendWelcomeEmail(user) {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1F4788; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 30px; background: #28A745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to GarageWallet!</h1>
        </div>
        <div class="content">
            <p>Hello ${user.full_name},</p>
            <p>Welcome to GarageWallet! Your account has been created successfully.</p>
            <p>You can now start tracking client revenue, managing contracts, and identifying upsell opportunities.</p>
            <div style="text-align: center;">
                <a href="${config.CORS_ORIGIN}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Garage Collective. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: config.EMAIL_FROM,
            to: user.email,
            subject: 'Welcome to GarageWallet!',
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Welcome email sent to: ${user.email}`);
        } catch (error) {
            logger.error('Error sending welcome email:', error);
        }
    }

    /**
     * Send Renewal Task Assignment Email
     * @param {object} user - Assigned user
     * @param {object} task - Renewal task details
     */
    async sendRenewalTaskEmail(user, task) {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DC3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 30px; background: #1F4788; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .task-details { background: white; padding: 15px; border-left: 4px solid #DC3545; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ New Renewal Task Assigned</h1>
        </div>
        <div class="content">
            <p>Hello ${user.full_name},</p>
            <p>A new contract renewal task has been assigned to you:</p>
            <div class="task-details">
                <p><strong>Client:</strong> ${task.clientName}</p>
                <p><strong>Current MRR:</strong> ${task.mrr}</p>
                <p><strong>Contract End Date:</strong> ${task.endDate}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Due Date:</strong> ${task.dueDate}</p>
            </div>
            <div style="text-align: center;">
                <a href="${config.CORS_ORIGIN}/contracts" class="button">View Task</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 Garage Collective. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: config.EMAIL_FROM,
            to: user.email,
            subject: `⚠️ Renewal Task: ${task.clientName}`,
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Renewal task email sent to: ${user.email}`);
        } catch (error) {
            logger.error('Error sending renewal task email:', error);
        }
    }
    /**
     * Send Invoice Email with PDF attachment
     * @param {object} invoice
     * @param {object} client
     * @param {string} pdfBase64
     */
    async sendInvoiceEmail(invoice, client, pdfBase64) {
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }

        const toEmail = invoice.contactEmail || client?.contactEmail;
        if (!toEmail) {
            throw new Error('No client email address available');
        }

        const invoiceDate = invoice.invoiceDate
            ? new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const totalFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.total || 0);
        const clientName = invoice.clientName || client?.clientName || 'Sir/Ma\'am';
        const filename = `${(invoice.invoiceNumber || 'invoice').replace(/\//g, '-')}.pdf`;

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Tax Invoice</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td>
  <table width="600" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- HEADER -->
    <tr><td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:36px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <p style="margin:0 0 4px;color:#ffffff;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Tax Invoice</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">Garage Productions Pvt. Ltd.</h1>
          <p style="margin:8px 0 0;color:#ffffff;font-size:12px;font-weight:500;">GSTIN: 09AAGCG1126N1ZG &nbsp;&nbsp;|&nbsp;&nbsp; PAN: AAGCG1126N</p>
        </td>
        <td align="right" valign="middle">
          <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:10px 16px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:11px;font-weight:500;">Invoice No.</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:13px;font-weight:700;">${invoice.invoiceNumber}</p>
          </div>
        </td>
      </tr></table>
    </td></tr>

    <!-- BODY -->
    <tr><td style="padding:40px 40px 32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.5;">Dear <strong style="color:#1e1b4b;">${clientName}</strong>,</p>
      <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">Please find attached the Tax Invoice for services rendered by Garage Productions Pvt. Ltd. The details are summarised below for your reference.</p>

      <!-- Invoice details card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:32px;">
        <tr style="background:#f8fafc;">
          <td width="45%" style="padding:14px 20px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Invoice Number</td>
          <td style="padding:14px 20px;font-size:13px;color:#1e1b4b;font-weight:600;border-bottom:1px solid #e5e7eb;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Invoice Date</td>
          <td style="padding:14px 20px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;">${invoiceDate}</td>
        </tr>
        <tr style="background:#f0fdf4;">
          <td style="padding:18px 20px;font-size:13px;font-weight:700;color:#14532d;">Amount Due (incl. GST)</td>
          <td style="padding:18px 20px;font-size:20px;font-weight:800;color:#16a34a;">${totalFormatted}</td>
        </tr>
      </table>

      <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.7;">Kindly process the payment as per the agreed terms. The invoice PDF is attached to this email for your records and accounting purposes.</p>
      <p style="margin:0 0 32px;color:#6b7280;font-size:14px;line-height:1.7;">For any queries or clarifications regarding this invoice, please do not hesitate to reach out to us at <a href="mailto:finance@garageproductions.in" style="color:#4338ca;text-decoration:none;font-weight:500;">finance@garageproductions.in</a></p>

      <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">Warm regards,<br><strong style="color:#1e1b4b;font-size:15px;">Garage Productions Pvt. Ltd.</strong></p>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;text-align:center;">This is a system-generated email. Please do not reply directly to this email.<br>&copy; 2026 Garage Productions Pvt. Ltd. All rights reserved.</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

        const cc = config.EMAIL_CC_SAURABH ? [config.EMAIL_CC_SAURABH] : [];

        const mailOptions = {
            from: config.EMAIL_FROM,
            to: toEmail,
            ...(cc.length && { cc }),
            subject: `Tax Invoice ${invoice.invoiceNumber} — Garage Productions Pvt. Ltd.`,
            html: htmlContent,
            attachments: [{
                filename,
                content: Buffer.from(pdfBase64, 'base64'),
                contentType: 'application/pdf',
            }],
        };

        await this.transporter.sendMail(mailOptions);
        logger.info(`Invoice email sent to: ${toEmail}`);
    }

    /**
     * Send Payment Reminder Email
     * @param {object} invoice
     * @param {object} client
     * @param {string} pdfBase64
     * @param {number} daysPast - 15, 30 or 45
     */
    async sendReminderEmail(invoice, client, pdfBase64, daysPast) {
        if (!this.transporter) throw new Error('Email service not configured');

        const toEmail = invoice.contactEmail || client?.contactEmail;
        if (!toEmail) throw new Error('No client email address available');

        const invoiceDate = invoice.invoiceDate
            ? new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const totalFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(invoice.total || 0);
        const clientName = invoice.clientName || client?.clientName || 'Sir/Ma\'am';
        const filename = `${(invoice.invoiceNumber || 'invoice').replace(/\//g, '-')}.pdf`;

        const urgency = daysPast >= 45 ? 'Final' : daysPast >= 30 ? '2nd' : '1st';
        const subject = `${urgency} Payment Reminder — Invoice ${invoice.invoiceNumber} (${daysPast} Days Overdue)`;

        const headerBg = daysPast >= 45
            ? 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)'
            : daysPast >= 30
            ? 'linear-gradient(135deg,#78350f 0%,#92400e 100%)'
            : 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)';
        const urgencyColor   = daysPast >= 45 ? '#dc2626' : daysPast >= 30 ? '#d97706' : '#4338ca';
        const urgencyBg      = daysPast >= 45 ? '#fef2f2' : daysPast >= 30 ? '#fffbeb' : '#eef2ff';
        const urgencyBorder  = daysPast >= 45 ? '#fecaca' : daysPast >= 30 ? '#fde68a' : '#c7d2fe';

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Payment Reminder</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td>
  <table width="600" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- HEADER -->
    <tr><td style="background:${headerBg};padding:36px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <p style="margin:0 0 4px;color:#ffffff;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">${urgency} Payment Reminder</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Garage Productions Pvt. Ltd.</h1>
          <p style="margin:8px 0 0;color:#ffffff;font-size:12px;font-weight:500;">GSTIN: 09AAGCG1126N1ZG &nbsp;&nbsp;|&nbsp;&nbsp; PAN: AAGCG1126N</p>
        </td>
        <td align="right" valign="middle">
          <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:11px;font-weight:500;">Days Overdue</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:24px;font-weight:800;">${daysPast}</p>
          </div>
        </td>
      </tr></table>
    </td></tr>

    <!-- URGENCY BANNER -->
    <tr><td style="background:${urgencyBg};border-bottom:1px solid ${urgencyBorder};padding:14px 40px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:${urgencyColor};">
        ${daysPast >= 45
            ? '⚠️ Final Notice — Immediate payment required. Further delay may result in escalation.'
            : daysPast >= 30
            ? '⚠️ Second Reminder — Payment is significantly overdue. Kindly prioritise settlement.'
            : 'ℹ️ Friendly Reminder — Your invoice payment is now 15 days past due.'}
      </p>
    </td></tr>

    <!-- BODY -->
    <tr><td style="padding:40px 40px 32px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.5;">Dear <strong style="color:#1e1b4b;">${clientName}</strong>,</p>
      <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">This is a <strong style="color:#374151;">${urgency} reminder</strong> that the following invoice remains unpaid and is now <strong style="color:${urgencyColor};">${daysPast} days overdue</strong>. We kindly request your prompt attention to this matter.</p>

      <!-- Invoice details -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:32px;">
        <tr style="background:#f8fafc;">
          <td width="45%" style="padding:14px 20px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Invoice Number</td>
          <td style="padding:14px 20px;font-size:13px;color:#1e1b4b;font-weight:600;border-bottom:1px solid #e5e7eb;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Invoice Date</td>
          <td style="padding:14px 20px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;">${invoiceDate}</td>
        </tr>
        <tr>
          <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Days Overdue</td>
          <td style="padding:14px 20px;font-size:13px;font-weight:700;color:${urgencyColor};border-bottom:1px solid #e5e7eb;">${daysPast} Days</td>
        </tr>
        <tr style="background:#fef2f2;">
          <td style="padding:18px 20px;font-size:13px;font-weight:700;color:#7f1d1d;">Outstanding Amount</td>
          <td style="padding:18px 20px;font-size:20px;font-weight:800;color:#dc2626;">${totalFormatted}</td>
        </tr>
      </table>

      <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.7;">A copy of the original invoice is attached to this email for your reference. Please process the payment at the earliest to avoid any further follow-up.</p>
      <p style="margin:0 0 32px;color:#6b7280;font-size:14px;line-height:1.7;">For any queries, please reach out at <a href="mailto:finance@garageproductions.in" style="color:#4338ca;text-decoration:none;font-weight:500;">finance@garageproductions.in</a></p>

      <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">Regards,<br><strong style="color:#1e1b4b;font-size:15px;">Garage Productions Pvt. Ltd.</strong></p>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;text-align:center;">This is a system-generated reminder. Please do not reply directly to this email.<br>&copy; 2026 Garage Productions Pvt. Ltd. All rights reserved.</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

        const cc = config.EMAIL_CC_SAURABH ? [config.EMAIL_CC_SAURABH] : [];
        await this.transporter.sendMail({
            from: config.EMAIL_FROM,
            to: toEmail,
            ...(cc.length && { cc }),
            subject,
            html: htmlContent,
            attachments: [{
                filename,
                content: Buffer.from(pdfBase64, 'base64'),
                contentType: 'application/pdf',
            }],
        });
        logger.info(`Reminder email (${daysPast}d) sent to: ${toEmail}`);
    }
}

module.exports = new EmailService();
