const nodemailer = require('nodemailer');

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
};

const sendOtpEmail = async ({ to, otp, role }) => {
  const transporter = buildTransporter();
  if (!transporter) {
    console.log(`[OTP] ${to} (${role}): ${otp}`);
    return;
  }

  const from = process.env.SMTP_FROM || 'MedFinder <no-reply@medfinder.lk>';
  const subject = 'Your MedFinder login code';
  const text = `Your MedFinder login code is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
};

module.exports = {
  sendOtpEmail,
};
