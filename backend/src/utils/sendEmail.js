const nodemailer = require('nodemailer');

// Use Ethereal if credentials are not provided (great for testing)
const getTransporter = async () => {
  if (process.env.SMTP_USER === 'dummy_user@ethereal.email' || !process.env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // If using Gmail, 'service: gmail' is the most reliable option on cloud hosts like Render
  const isGmail = 
    process.env.SMTP_HOST === 'smtp.gmail.com' || 
    (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com'));

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await getTransporter();
    
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'MandalPro'}" <${process.env.SMTP_FROM || 'noreply@mandalpro.com'}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Sent] Message sent: ${info.messageId}`);
    
    // Preview URL will only be available if using Ethereal email
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log(`[Email Preview] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    console.error(`[Email Error] Failed to send email: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
