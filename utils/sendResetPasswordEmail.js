import nodemailer from "nodemailer";

const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, FRONTEND_URL } = process.env;

//^ Надсилання листа для скидання паролю
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendResetPasswordEmail = async ({ to, resetToken }) => {
  const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Reset Your Password",
    html: `
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't sent this request just ignore this email. Maybe somebody sent is mistakenly.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset password email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send reset password email to ${to}:`, error);
    throw new Error(`Failed to send reset password email: ${error.message}`);
  }
};
