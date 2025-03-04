import { Schema } from "mongoose";

export const CardSchema = new Schema(
  {
    cardName: String,
    public_id: String, // Public card id from Cloudinary
    url: String, // Card url from Cloudinary
  },
  { versionKey: false, timestamps: false }, //   { versionKey: false, timestamps: false }, // { ..., _id: false } // Якщо не хочете додавати додатковий _id для кожної картки в масиві
);
