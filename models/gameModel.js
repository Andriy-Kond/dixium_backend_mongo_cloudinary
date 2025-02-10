import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const GameSchema = new Schema(
  {
    name: String,
    players: [{ userId: String, name: String, avatar: String }],
    cards: [{ public_id: String, url: String }],
  },

  { versionKey: false, timestamps: true },
);

GameSchema.post("save", handleMongooseError);

export const Game = model("game", GameSchema);
