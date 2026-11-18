import nodemailer from 'nodemailer';

let transporter;

function getTransport(env) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  transporter ||= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export async function sendPasswordResetEmail(env, email, resetToken) {
  const transport = getTransport(env);
  if (!transport) {
    console.warn('Password reset requested but SMTP is not configured; no email was sent.');
    return false;
  }
  const resetUrl = new URL('/reset-password', env.CLIENT_URL);
  resetUrl.searchParams.set('token', resetToken);
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Reset your Aurelia Grand password',
    text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
  });
  return true;
}
