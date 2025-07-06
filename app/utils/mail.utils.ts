import nodemailer from "nodemailer";
import envConfig from "../config/env.config";

// Email configuration interface
interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: envConfig.EMAIL_USER,
      pass: envConfig.EMAIL_PASS,
    },
  });
};

// Send email function
export const sendEmail = async (config: EmailConfig): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: envConfig.EMAIL_USER,
      to: Array.isArray(config.to) ? config.to.join(", ") : config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
      attachments: config.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Send welcome email to new caller
export const sendWelcomeEmail = async (
  callerEmail: string,
  callerName: string,
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0a3d62 0%, #0d5b94 100%); color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dycvkezau/image/upload/v1751786166/WhatsApp_Image_2025-07-03_at_10.39.29_245bf40b-removebg-preview_iwumxs.png" 
               alt="Company Logo" 
               style="max-width: 150px; height: auto; margin: 0 auto; display: block;">
        </div>
        <h1 style="margin: 0; font-size: 28px;">Welcome to Our Service!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for registering with us</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #0a3d62; margin-bottom: 20px;">Hello ${callerName},</h2>
        
        <p style="line-height: 1.6; color: #333; margin-bottom: 20px;">
          Welcome to our emergency response system! Your account has been successfully created and you're now registered in our database.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0a3d62; margin-top: 0;">What's Next?</h3>
          <ul style="color: #333; line-height: 1.8;">
            <li>Your information is securely stored in our system</li>
            <li>Emergency services can access your details when needed</li>
            <li>You can update your information anytime</li>
            <li>Your privacy and security are our top priorities</li>
          </ul>
        </div>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0a3d62; margin-top: 0;">Emergency Contact</h3>
          <p style="color: #333; margin-bottom: 10px;">
            In case of emergency, please contact:
          </p>
          <p style="color: #dc3545; font-weight: bold; margin: 0;">
            Emergency Services: 911
          </p>
        </div>
        
        <p style="line-height: 1.6; color: #333; margin-top: 30px;">
          If you have any questions or need to update your information, please don't hesitate to contact our support team.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: callerEmail,
    subject: "Welcome to Our Emergency Response System",
    html: html,
  });
};

// Send admin notification email
export const sendAdminNotification = async (
  adminEmail: string,
  callerName: string,
  callerEmail: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0a3d62 0%, #0d5b94 100%); color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dycvkezau/image/upload/v1751786166/WhatsApp_Image_2025-07-03_at_10.39.29_245bf40b-removebg-preview_iwumxs.png" 
               alt="Company Logo" 
               style="max-width: 150px; height: auto; margin: 0 auto; display: block;">
        </div>
        <h1 style="margin: 0; font-size: 28px;">New Caller Registration</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">A new caller has been added to the system</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #0a3d62; margin-bottom: 20px;">Admin Notification</h2>
        
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0a3d62; margin-top: 0;">New Caller Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${callerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${callerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Registration Time:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Action Required</h3>
          <p style="color: #856404; margin-bottom: 10px;">
            Please review the caller's information and verify their details in the admin panel.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="/admin/callers" style="background: #0a3d62; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Caller Details
          </a>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject: "New Caller Registration - Admin Notification",
    html: html,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  const resetLink = `${envConfig.HOST_ENVIORMENT}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0a3d62 0%, #0d5b94 100%); color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dycvkezau/image/upload/v1751786166/WhatsApp_Image_2025-07-03_at_10.39.29_245bf40b-removebg-preview_iwumxs.png" 
               alt="Company Logo" 
               style="max-width: 150px; height: auto; margin: 0 auto; display: block;">
        </div>
        <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Reset your account password</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #0a3d62; margin-bottom: 20px;">Hello ${userName},</h2>
        
        <p style="line-height: 1.6; color: #333; margin-bottom: 20px;">
          We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <a href="${resetLink}" style="background: #0a3d62; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0a3d62; margin-top: 0;">Security Notice</h3>
          <ul style="color: #333; line-height: 1.8;">
            <li>This link will expire in 1 hour</li>
            <li>Never share this link with anyone</li>
            <li>If you didn't request this, please contact support</li>
          </ul>
        </div>
        
        <p style="line-height: 1.6; color: #333; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; color: #0a3d62; font-size: 14px;">
          ${resetLink}
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: html,
  });
};

// Send generic notification email
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string,
  userName?: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0a3d62 0%, #0d5b94 100%); color: white; padding: 30px; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dycvkezau/image/upload/v1751786166/WhatsApp_Image_2025-07-03_at_10.39.29_245bf40b-removebg-preview_iwumxs.png" 
               alt="Company Logo" 
               style="max-width: 150px; height: auto; margin: 0 auto; display: block;">
        </div>
        <h1 style="margin: 0; font-size: 28px;">Notification</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${subject}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        ${userName ? `<h2 style="color: #0a3d62; margin-bottom: 20px;">Hello ${userName},</h2>` : ''}
        
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="line-height: 1.6; color: #333; margin: 0;">
            ${message}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to,
    subject,
    html,
  });
};

// Send caller registration email with credentials
export const sendCallerRegistrationEmail = async (
  callerEmail: string,
  callerName: string,
  username: string,
  password: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg,rgb(237, 239, 241) 0%,rgb(219, 235, 246) 100%); color: #0a3d62; padding: 30px; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dycvkezau/image/upload/v1751786166/WhatsApp_Image_2025-07-03_at_10.39.29_245bf40b-removebg-preview_iwumxs.png" 
               alt="Company Logo" 
               style="max-width: 150px; height: auto; margin: 0 auto; display: block;">
        </div>
        <h1 style="margin: 0; font-size: 28px;">Account Created Successfully!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your caller account is ready</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #0a3d62; margin-bottom: 20px;">Hello ${callerName},</h2>
        
        <p style="line-height: 1.6; color: #333; margin-bottom: 20px;">
          Your account has been successfully created in our Display Doctor system. Below are your login credentials:
        </p>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0a3d62;">
          <h3 style="color: #0a3d62; margin-top: 0;">Your Login Credentials</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Username:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-family: monospace; color: #0a3d62;">${username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Password:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-family: monospace; color: #0a3d62;">${password}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Important Security Notice</h3>
          <ul style="color: #856404; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Please change your password after your first login</li>
            <li>Keep your credentials secure and don't share them</li>
            <li>Your account is now active in our Display Doctor system</li>
            <li>You can update your profile information anytime</li>
          </ul>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0a3d62; margin-top: 0;">What You Can Do</h3>
          <ul style="color: #333; line-height: 1.8;">
            <li>Access your Display Doctor profile</li>
            <li>Update your contact information</li>
            <li>View your Display Doctor history</li>
            <li>Manage your emergency contacts</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="/login" style="background: #0a3d62; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #0a3d62; margin-top: 0;">Need Help?</h3>
          <p style="color: #333; margin-bottom: 10px;">
            If you have any questions or need assistance, please contact our support team:
          </p>
          <p style="color: #0a3d62; font-weight: bold; margin: 0;">
            Support Email: support@emergencyresponse.com<br>
            Support Phone: +1-800-EMERGENCY
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: callerEmail,
    subject: "Your Emergency Response Account - Login Credentials",
    html: html,
  });
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}; 