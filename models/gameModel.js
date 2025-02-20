import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";

const GameSchema = new Schema(
  {
    gameName: String, // Game name
    players: [{ name: String, avatar: String }], // List of players
    deck: [
      {
        cardName: String,
        public_id: String, // Public card id from Cloudinary
        url: String, // Card url from Cloudinary
        _id: Schema.Types.ObjectId, // Card id from MongoDB (like owner)
      },
    ], // Deck of cards
    isGameRun: Boolean, // game started and running (players cannot join)
    isGameStarted: Boolean, // game started but not running (players can join)
    hostPlayerId: String,
    hostPlayerName: String,
    gameTitle: String,
  },

  { versionKey: false, timestamps: true },
);

GameSchema.post("save", handleMongooseError);

export const Game = model("game", GameSchema);
