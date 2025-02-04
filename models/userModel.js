// authModel or userModel

import { Schema, model } from "mongoose";
import validator from "validator";
import Joi from "joi";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const { isLength } = validator;

const emailRegExp = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})*$/;

// /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const emailValidator = {
  validator: value => {
    return emailRegExp.test(value);
  },
  message:
    "Invalid email format. Ensure at least one domain after @ and at least 2 characters after the last dot.",
};

const passwordValidator = {
  validator: value => isLength(value, { min: 3, max: 150 }),
  message: "Password must be 3-150 characters long",
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
      match: [emailRegExp, "Invalid email format"],

      //* Unique check
      // For unique error must be status 409 and should be other error message
      // unique: true, ["This error already in db"] //~ in this case error.code always will be 400, not 409! So, you should change in in  errors handling middleware (handleMongooseError)
      unique: true, //~ You can add custom error massage in handleMongooseError. But this middleware universal for all mongoose models. So you should change message in authController.js
      // or "validate" if more complex expression needed:
      // validate: emailValidator,

      // email must be uniq item in db. Cannot be two users with the same email.
      // unique: [true, "This email already in db"], // make field "email" unique within this collection
      // "message": "E11000 duplicate key error collection: phone_book_db.users index: email_1 dup key: { email: \"andrii@vestibul.co.uk\" }"
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: passwordValidator,
    },
    token: {
      type: String,
      default: "",
    },
    avatarURL: {
      type: String,
      required: true,
      default: "",
    },
  },
  { versionKey: false, timestamps: true },
);

// ! Middleware for errors of mongoose schema:
mongooseUserSchema.post("save", handleMongooseError);

export const User = model("user", mongooseUserSchema);

//^ Joi-schemas - validates data coming from the frontend
const registerUser = Joi.object({
  name: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().pattern(emailRegExp).required(),
  password: Joi.string().required(),
});

const loginUser = Joi.object({
  email: Joi.string().pattern(emailRegExp).required(),
  password: Joi.string().required(),
});

export const joiUserSchemas = {
  registerUser,
  loginUser,
};
