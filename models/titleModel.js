import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";
import { CardSchema } from "./cardSchema.js";

const TitleSchema = new Schema(
  {
    name: String,
    cards: [CardSchema],
  },

  { versionKey: false, timestamps: true },
);

TitleSchema.post("save", handleMongooseError);

export const Title = model("title", TitleSchema);
