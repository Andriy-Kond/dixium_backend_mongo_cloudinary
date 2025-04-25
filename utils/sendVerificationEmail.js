import nodemailer from "nodemailer";

const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, FRONTEND_URL } = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendVerificationEmail = async ({ to, verificationToken }) => {
  // const verificationLink = `${FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;
  const verificationLink = `${FRONTEND_URL}/api/auth/verify-email/${verificationToken}`;

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Verify Your Email",
    html: `
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};
