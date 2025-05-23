// authModel or userModel

import { Schema, model } from "mongoose";
import validator from "validator";
import Joi from "joi";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const { isLength } = validator;

// /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const emailRegExp = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})*$/;
const emailValidator = {
  validator: value => {
    return emailRegExp.test(value);
  },
  message:
    "Invalid email format. Ensure at least one domain after @ and at least 2 characters after the last dot.",
};

const passwordValidator = {
  validator: value => isLength(value, { min: 3, max: 100 }),
  message: "Password must be 3-100 characters long",
};

//^ Mongoose-schema - validate data before for save it in db
const mongooseUserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [30, "Name must be not exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // You can use "match" for simple validation:
      // match: [emailRegExp, "Invalid email format"],

      //* Unique check
      // For unique error must be status 409 and should be other error message
      // unique: true, ["This error already in db"] //~ in this case error.code always will be 400, not 409! So, you should change it in errors handling middleware (handleMongooseError)
      unique: true, //~ You can add custom error massage in handleMongooseError. But this middleware universal for all mongoose models. So you should change message in authController.js

      // or "validate" if more complex expression needed:
      validate: emailValidator,

      // email must be uniq item in db. Cannot be two users with the same email.
      // unique: [true, "This email already in db"], // make field "email" unique within this collection
      // "message": "E11000 duplicate key error collection: phone_book_db.users index: email_1 dup key: { email: \"andrii@vestibul.co.uk\" }"
    },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationDeadline: { type: Date, default: null }, // Дедлайн для верифікації email
    verificationToken: { type: String, default: null },

    password: {
      type: String,
      // Пароль не обов’язковий для Google-авторизації, тому його треба прибрати
      // required: [true, "Password is required"],
      required: false, // Дозволяє null/undefined для користувачів Google
      validate: passwordValidator,
    },
    token: { type: String, default: "" }, // todo прибрати при переході на cookie
    avatarURL: { type: String, required: true, default: "" },
    googleId: {
      type: String,
      unique: true,
      // sparse: true, // Дозволяє значення null для не-Google користувачів (щоб уникнути конфліктів унікальності для користувачів без цих полів) - // !НЕ ПРАЦЮЄ
    },
    appleId: { type: String, unique: true },
    playerGameId: {
      type: Number,
      // unique: true
    },
    userActiveGameId: {
      type: String,
      unique: true,
    },

    refreshToken: { type: String, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { versionKey: false, timestamps: true },
);

// ! Middleware for errors of mongoose schema:
mongooseUserSchema.post("save", handleMongooseError);

export const User = model("user", mongooseUserSchema);

//^ Joi-schemas - validates data coming from the frontend
const registerUser = Joi.object({
  name: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().pattern(emailRegExp).required().messages({
    "string.pattern.base":
      "Invalid email format. Please provide a valid email address.",
  }),
  // email: Joi.string().required(),
  password: Joi.string().required(),
});

const loginUser = Joi.object({
  // email: Joi.string().pattern(emailRegExp).required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const setPassword = Joi.object({
  password: Joi.string().min(3).max(100).required(),
});

const setNickname = Joi.object({
  nickname: Joi.string().min(3).max(30).required(),
});

// const resendVerification = Joi.object({});
const resendVerification = Joi.object({
  // email: Joi.string().required(),
  email: Joi.string().pattern(emailRegExp).required().messages({
    "string.pattern.base":
      "Invalid email format. Please provide a valid email address.",
  }),
  // email: Joi.string().required().messages({
  //   "string.pattern.base":
  //     "Invalid email format. Please provide a valid email address.",
  // }),

  recaptchaToken: Joi.string().required().messages({
    "string.empty": "reCAPTCHA token is required",
  }),

  captchaType: Joi.string().valid("v3", "v2").required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().required(),
});

const resetPassword = Joi.object({
  password: Joi.string().min(3).max(100).required(),
});

export const joiUserSchemas = {
  registerUser,
  loginUser,
  setPassword,
  resendVerification,
  forgotPassword,
  resetPassword,
  setNickname,
};
