import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";
import { CardSchema } from "./cardSchema.js";

const GameSchema = new Schema(
  {
    gameName: String, // Game name
    gamePoster: String,
    isGameRunning: Boolean, // game started and running (players can't join anymore)
    isGameStarted: Boolean, // game started but not running (players can join)
    hostPlayerId: String,
    hostPlayerName: String,
    storytellerId: String,
    cardsOnTable: [CardSchema], // Карти, які поклали на стіл під час голосування
    votes: { type: Map, of: String }, // Голоси гравців { playerId: cardId }
    scores: { type: Map, of: Number }, // Бали гравців { playerId: score }

    // deckId: { type: Schema.Types.ObjectId, ref: "deck" },
    // ref: "deck" - говорить Mongoose, що поле deckId містить ідентифікатор (ObjectId), який посилається на документ у колекції, пов'язаній із моделлю "deck".

    players: [
      {
        _id: String,
        name: String,
        avatarURL: String,
        hand: [CardSchema],
      },
    ], // List of players

    deck: [CardSchema], // Deck of cards

    discardPile: [CardSchema],
  },

  { versionKey: false, timestamps: true },
);

GameSchema.post("save", handleMongooseError);

export const Game = model("game", GameSchema);
