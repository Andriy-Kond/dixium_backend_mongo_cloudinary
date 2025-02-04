import { Schema, model } from "mongoose";

import Joi from "joi";
import { handleMongooseError } from "../utils/handleMongooseError.js";
import validator from "validator";

const { isLength } = validator;

const numberTypeList = ["home", "work", "friend"];
const birthDateRegExp = /^\d{2}-\d{2}-\d{4}$/;
// Regular expression:
// - at least 1 domain after "@"
// - at least 2 symbols after the last period
const emailRegExp = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})*$/;

//^ Mongoose-schema - validate data before for save it in db
const mongooseContactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name i required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [30, "Name must be not exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Name is required"],
      validate: {
        // validator: value => isEmail(value), // Built-in in validator.js check for email
        validator: value => emailRegExp.test(value),
        message:
          "Invalid email format. Ensure at least one domain after @ and at least 2 characters after the last dot",
      },
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: value => isLength(value, { min: 10, max: 15 }),
        message: "Phone must be 10-15 characters long",
      },
    },
    favorite: {
      type: Boolean, // boolean type of value
      default: false, // default value
    },
    number_type: {
      type: Schema.Types.Mixed, // Allows string or numbers types,
      enum: [numberTypeList, "Current value for number_type is not valid"], // array of possible values
      // or:
      // enum: {
      //   values: numberTypeList,
      //   message: "Current value for number_type is not valid", // in error case
      // },
      required: true,
    },
    birth_date: {
      type: String,
      match: birthDateRegExp, // 25-08-1978
    },
    owner: {
      type: Schema.Types.ObjectId, // Special data type for id in MongoDB database
      ref: "user", // indicates from which collection this id
      required: true,
    },
  },

  { versionKey: false, timestamps: true },
);

// ! Middleware for errors of mongoose schema:
// Mongoose throws errors without status. If status not presented, will be error.status = 500, because in case of error, tryCatchDecorator() will catch it and invokes next(error). The next with error argument will invoke app.use((err, req, res, next) in app.js and set status = 500. But error of body validation is not 500 status (Internal Server Error), but must be 400 status (Bad request). Therefore you should set status=400 in additional middleware.
// The next middleware will works when will be error from any of Mongoose-schema methods (.find(), .create(), etc).
mongooseContactSchema.post("save", handleMongooseError);
// This fn will be the same for each schemas of Mongoose. Therefore you should to move this fn to isolated file (to helpers/utils)

export const Contact = model("contact", mongooseContactSchema); // Creating mongoose model (schema)

//^ Joi-schemas - validate data that comes from the frontend
// Joi and Mongoose schemas works together. Joi-schema verifying incoming data, Mongoose-schema verifying data that you want to save in database.
// For example incoming data of date can be in format "YYYY-MM-DD", but in database format should be in format "DD-MM-YYYY". So after incoming data you should to formatting it in right format before note it in database.

// Schema for set all fields (add new contact or edit contact)
const addContact = Joi.object({
  name: Joi.string()
    // .pattern(new RegExp("^[a-zA-Z0-9-_]{3,30}$"))
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  // email: Joi.string()
  //   .email({
  //     minDomainSegments: 2, // After last dot must be minimum 2 symbols
  //   })
  //   .required(),
  email: Joi.string().pattern(emailRegExp),
  phone: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  favorite: Joi.boolean(),
  number_type: Joi.string()
    .valid(...numberTypeList)
    .required(),
  birth_date: Joi.string().pattern(birthDateRegExp).required(),
});

// Schema for set the "favorite" field only
const editFavorite = Joi.object({
  favorite: Joi.boolean().required(),
});

export const joiContactSchemas = {
  addContact,
  editFavorite,
};
