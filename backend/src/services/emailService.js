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
                this.transporter = nodemailer.createTransporter({
                    host: config.SMTP_HOST,
                    port: config.SMTP_PORT,
                    secure: false, // Use TLS
                    auth: {
                        user: config.SMTP_USER,
                        pass: config.SMTP_PASSWORD,
                    },
                });
                logger.info('Email service initialized successfully');
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
}

module.exports = new EmailService();
