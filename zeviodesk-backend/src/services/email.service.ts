import { logger } from "../config/logger.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  sendEmail: async (to: string, subject: string, body: string, html?: string): Promise<boolean> => {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Zevio Desk" <no-reply@zeviodesk.com>',
        to,
        subject,
        text: body,
        html: html || body,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`📧 [EmailService] Sent email to ${to}: "${subject}". MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`❌ [EmailService] Failed to send email to ${to}: ${error}`);
      return false;
    }
  },

  sendWelcomeEmail: async (to: string, name: string): Promise<boolean> => {
    return emailService.sendEmail(
      to,
      "Welcome to Support Platform",
      `Hello ${name}, welcome aboard! Your account is now active.`
    );
  },
  
  sendSetupPasswordEmail: async (to: string, name: string, setupLink: string): Promise<boolean> => {
    const htmlContent = `
      <h2>Welcome, ${name}!</h2>
      <p>Your shop admin account has been created successfully.</p>
      <p>Please click the link below to set up your password and access your dashboard:</p>
      <a href="${setupLink}" style="padding: 10px 20px; background-color: #D99B26; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Set Password</a>
      <p>Or copy this link to your browser: ${setupLink}</p>
    `;
    
    return emailService.sendEmail(
      to,
      "Set up your Zevio Desk Account",
      `Hello ${name}, welcome! Please set up your password using this link: ${setupLink}`,
      htmlContent
    );
  }
};
