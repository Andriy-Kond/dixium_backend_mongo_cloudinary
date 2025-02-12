import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const DeckSchema = new Schema(
  {
    name: String,
    cards: [{ cardName: String, public_id: String, url: String }],
  },

  { versionKey: false, timestamps: true },
);

DeckSchema.post("save", handleMongooseError);

export const Deck = model("deck", DeckSchema);
