import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";
import { CardSchema } from "./cardSchema.js";

const DeckSchema = new Schema(
  {
    name: String,
    cards: [CardSchema],
  },

  { versionKey: false, timestamps: true },
);

DeckSchema.post("save", handleMongooseError);

export const Deck = model("deck", DeckSchema);
