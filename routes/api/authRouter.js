import express from "express";
import { checkErrorJoiSchemaDecorator } from "../../middlewares/checkErrorJoiSchemaDecorator.js";
import { joiUserSchemas } from "../../models/userModel.js";
import { authController } from "../../controllers/authController.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { upload } from "../../middlewares/upload.js";
import { authRateLimiter } from "../../middlewares/rateLimit.js";

export const authRouter = express.Router();

// * local middlewares "checkErrorJoiSchemaDecorator" checks by model for each request where you receive data:
// Застосування обмежувача authRateLimiter до маршрутів авторизації
// signup
authRouter.post(
  "/register",
  authRateLimiter,
  checkErrorJoiSchemaDecorator(joiUserSchemas.registerUser), // check by User model
  authController.register, // register new user
);

authRouter.get("/verify-email/:verificationToken", authController.verifyEmail);

authRouter.post(
  "/resend-verification",
  authenticate,
  checkErrorJoiSchemaDecorator(joiUserSchemas.resendVerification),
  authController.resendVerificationEmail,
);

// login
authRouter.post(
  "/login",
  authRateLimiter,
  checkErrorJoiSchemaDecorator(joiUserSchemas.loginUser), // check by User model
  authController.login, // register new user
);

// login by google
authRouter.post("/google", authRateLimiter, authController.googleLogin);

// take token from .../current Отримання поточного користувача
authRouter.get(
  "/current",
  authenticate, // checks whether token is correct
  authController.getCurrentUser, // check whether token is still valid
);

// Встановлювання паролю для авторизованих користувачів Google
authRouter.post(
  "/set-password",
  authenticate,
  checkErrorJoiSchemaDecorator(joiUserSchemas.setPassword),
  authController.setPassword,
);

// введення email на який тре відправити посилання на відновлення паролю
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  checkErrorJoiSchemaDecorator(joiUserSchemas.forgotPassword),
  authController.forgotPassword,
);

// створення нового паролю (відновлення після того як забув)
authRouter.post(
  "/reset-password/:resetToken",
  checkErrorJoiSchemaDecorator(joiUserSchemas.resetPassword),
  authController.resetPassword,
);

// logout
authRouter.post(
  "/logout",
  authenticate, // checks if user is logged in
  authController.logout,
);

// Change avatar
authRouter.patch(
  "/avatars",
  authenticate, // checks if user is logged in
  upload.single("avatarFile"),
  authController.changeAvatar,
);

// authRouter.post("/refresh-token", authController.refreshToken);
