import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const GameSchema = new Schema(
  {
    gameName: String,
    players: [{ userId: String, name: String, avatar: String }],
    deck: [
      {
        cardName: String,
        public_id: String,
        url: String,
        _id: Schema.Types.ObjectId,
      },
    ],
    isGameStarted: Boolean,
    hostPlayer: Schema.Types.ObjectId,
  },

  { versionKey: false, timestamps: true },
);

GameSchema.post("save", handleMongooseError);

export const Game = model("game", GameSchema);
