const nodemailer = require('nodemailer');

let transporterPromise;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    transporterPromise = transporter;
    return transporterPromise;
  }

  // Development fallback: Ethereal (ephemeral test inbox)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  transporterPromise = transporter;
  console.warn('Email: Using Ethereal test SMTP. Set SMTP_* env vars for production.');
  return transporterPromise;
}

function renderWelcomeHtml({ userName, designation, institute, createdBy, loginEmail }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const instBlock = institute ? `
    <tr><td style="padding:4px 0"><strong>Institute:</strong> ${institute.name} (${institute.id})</td></tr>
    <tr><td style="padding:4px 0"><strong>Type:</strong> ${institute.type || ''}</td></tr>
    <tr><td style="padding:4px 0"><strong>Address:</strong> ${institute.address || ''}</td></tr>
    <tr><td style="padding:4px 0"><strong>Contact:</strong> ${institute.contactNumber || ''}</td></tr>
  ` : '';
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1f2937">
    <h2 style="color:#111827;margin:0 0 12px">Welcome to Schedule Hub</h2>
    <p style="margin:0 0 12px">Hi ${userName},</p>
    <p style="margin:0 0 12px">Your ${designation} account has been created by <strong>${createdBy}</strong>.</p>
    <table style="margin:12px 0 16px">${instBlock}</table>
    <p style="margin:0 0 12px">Use your email <strong>${loginEmail}</strong> to sign in.</p>
    <p style="margin:0 0 16px"><a href="${appUrl}/login" style="background:#4f46e5;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Go to Login</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="color:#6b7280;margin:0">If you didn’t expect this, please contact your institute admin.</p>
  </div>`;
}

async function sendInstituteUserWelcome({ to, userName, designation, institute, createdBy, loginEmail }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || 'Schedule Hub <no-reply@smart-scheduler.local>';
  const subject = institute && institute.name
    ? `Welcome to ${institute.name} on Schedule Hub`
    : 'Welcome to Schedule Hub';
  const html = renderWelcomeHtml({ userName, designation, institute, createdBy, loginEmail });

  const info = await transporter.sendMail({ from, to, subject, html });

  if (nodemailer.getTestMessageUrl && info && info.messageId) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Email preview URL:', preview);
  }
  return info;
}

module.exports = { sendInstituteUserWelcome };

function renderPaymentReminderHtml({ instituteName, reason }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const isTrial = String(reason).toLowerCase() === 'trial-ended';
  const isExpired = String(reason).toLowerCase() === 'payment-ended' || String(reason).toLowerCase() === 'expired';
  const message = isTrial
    ? `The trial for <strong>${instituteName || 'your institute'}</strong> has ended. Please upgrade to continue using Schedule Hub without interruption.`
    : `The subscription for <strong>${instituteName || 'your institute'}</strong> has expired. Please renew to avoid interruption.`;
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1f2937">
    <h2 style="color:#111827;margin:0 0 12px">Subscription Renewal Reminder</h2>
    <p style="margin:0 0 12px">Dear Admin,</p>
    <p style="margin:0 0 12px">${message}</p>
    <p style="margin:0 0 16px"><a href="${appUrl}/admin/profile" style="background:#4f46e5;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Manage Subscription</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="color:#6b7280;margin:0">If you already paid, you can ignore this message.</p>
  </div>`;
}

async function sendPaymentReminder({ to, instituteName, reason }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || 'Schedule Hub <no-reply@smart-scheduler.local>';
  const subject = String(reason).toLowerCase() === 'trial-ended'
    ? `Trial Ended: ${instituteName || 'Institute'}`
    : `Subscription Expired: ${instituteName || 'Institute'}`;
  const html = renderPaymentReminderHtml({ instituteName, reason });
  const info = await transporter.sendMail({ from, to, subject, html });
  if (nodemailer.getTestMessageUrl && info && info.messageId) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Email preview URL:', preview);
  }
  return info;
}

module.exports.sendPaymentReminder = sendPaymentReminder;
