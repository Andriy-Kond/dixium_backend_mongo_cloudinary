import nodemailer from "nodemailer";

const {
  EMAIL_HOST,
  EMAIL_USER,
  EMAIL_PASS,
  FRONTEND_URL, // DEV:http://localhost:3000 , DEPLOY: dixium.vercel.app
} = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Перевірка з'єднання з SMTP (для логування)
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP connection successful");
  }
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  // await transporter.sendMail(mailOptions);
};
