import mongoose from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const mongooseGameSchema = new mongoose.Schema(
  {
    // players: [{ type: String }],
    name: { type: String },
    cards: [{ type: [{ public_id: String, url: String }] }],
  },

  { versionKey: false, timestamps: true },
);

mongooseGameSchema.post("save", handleMongooseError);

export const Game = mongoose.model("game", mongooseGameSchema);
