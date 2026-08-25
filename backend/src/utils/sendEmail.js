const nodemailer = require('nodemailer');

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_USER === 'dummy_user@ethereal.email' || !process.env.SMTP_USER) {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  }

  // If using Gmail, use Port 587 with STARTTLS (Render allows 587 but blocks 465/25)
  const isGmail = 
    process.env.SMTP_HOST === 'smtp.gmail.com' || 
    (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com'));

  if (isGmail) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const isSecure = port === 465;

    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: port,
      secure: isSecure, // false for 587 (STARTTLS), true for 465
      requireTLS: !isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return cachedTransporter;
};

const createGmailTransporter = (port) => {
  const is465 = port === 465;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: is465,
    requireTLS: !is465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
};

// ── 1. Resend HTTPS API (Recommended for Render — 100% works over HTTPS port 443) ──
const sendViaResend = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  console.log('[Email] Sending via Resend HTTPS API...');
  const fromAddress = process.env.RESEND_FROM || 'MandalPro <onboarding@resend.dev>';
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Resend API error (${response.status}): ${data.message || JSON.stringify(data)}`);
  }

  console.log(`[Email Sent] Delivered via Resend ID: ${data.id}`);
  return { messageId: data.id, provider: 'resend' };
};

// ── 2. Brevo HTTPS API (Alternative free provider over HTTPS) ──
const sendViaBrevo = async ({ to, subject, text, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  console.log('[Email] Sending via Brevo HTTPS API...');
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey.trim(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.SMTP_FROM_NAME || 'MandalPro',
        email: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mandalpro.com'
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Brevo API error (${response.status}): ${data.message || JSON.stringify(data)}`);
  }

  console.log(`[Email Sent] Delivered via Brevo ID: ${data.messageId}`);
  return { messageId: data.messageId, provider: 'brevo' };
};

const sendEmail = async ({ to, subject, text, html }) => {
  // Try HTTPS REST APIs first (immune to Render SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    return await sendViaResend({ to, subject, text, html });
  }

  if (process.env.BREVO_API_KEY) {
    return await sendViaBrevo({ to, subject, text, html });
  }

  const isGmail = 
    process.env.SMTP_HOST === 'smtp.gmail.com' || 
    (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com'));

  // If using Gmail on cloud hosting (Render), try port 587 (STARTTLS) first, then port 465
  if (isGmail && process.env.SMTP_USER) {
    const portsToTry = [587, 465];
    let lastError = null;

    for (const port of portsToTry) {
      try {
        console.log(`[Email] Attempting Gmail SMTP on port ${port}...`);
        const transporter = createGmailTransporter(port);
        const info = await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'MandalPro'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to,
          subject,
          text,
          html,
        });
        console.log(`[Email Sent] Message sent via port ${port}: ${info.messageId}`);
        return info;
      } catch (err) {
        console.warn(`[Email Warning] Port ${port} failed (${err.message}). Trying next...`);
        lastError = err;
      }
    }
    throw lastError;
  }

  // Standard generic SMTP / Ethereal fallback
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
    return info;
  } catch (error) {
    console.error(`[Email Error] Failed to send email: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
