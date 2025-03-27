import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";
import { CardSchema } from "./cardSchema.js";

const GameSchema = new Schema(
  {
    gameName: String, // Game name
    gamePoster: String,
    gameStatus: String, // "lobby" | "makingMove" | "voting" | "results" | "finished"
    isGameRunning: Boolean, // game started and running (players can't join anymore)
    isGameStarted: Boolean, // game started but not running (players can join)
    isFirstTurn: Boolean,
    isSingleCardMode: Boolean,

    hostPlayerId: String, // id творця гри
    hostPlayerName: String, // Ім'я творця гри
    storytellerId: String, // ID гравця, який зараз розповідає (той, хто робить перший хід)
    currentRound: Number, // 0

    cardsOnTable: [
      {
        cardName: String,
        public_id: String, // Public card id from Cloudinary
        url: String, // Card url from Cloudinary
        ownerId: String,
        // Випадкове розміщення карт на столі:
        position: {
          top: Number, // відсотки, наприклад, 25
          left: Number, // відсотки, наприклад, 35
        },
        rotation: Number, // градуси, наприклад, 45
      },
    ], // Карти, які поклали на стіл під час голосування
    votes: { type: Map, of: { type: Map, of: String } }, // Голоси гравців
    //     { playerId: {firstVotedCardId: firstVotedCardId, secondVotedCardId: secondVotedCardId} }
    scores: { type: Map, of: Number }, // Бали гравців { playerId: score }

    // deckId: { type: Schema.Types.ObjectId, ref: "deck" },
    // ref: "deck" - говорить Mongoose, що поле deckId містить ідентифікатор (ObjectId), який посилається на документ у колекції, пов'язаній із моделлю "deck".

    players: [
      {
        _id: String, //? Schema.Types.ObjectId ??? чи видалити повністю?
        name: String,
        avatarURL: String,
        hand: [CardSchema],
        isGuessed: Boolean,
        isVoted: Boolean,
      },
    ], // List of players

    deck: [CardSchema],
    // Deck of cards

    discardPile: [CardSchema],

    roundResults: [
      {
        cardId: String,
        cardName: String,
        url: String,
        ownerId: String,
        ownerName: String,
        votesForThisCard: [
          {
            playerName: String,
            voteCount: Number,
          },
        ],
      },
    ],
  },

  { versionKey: false, timestamps: true },
);

GameSchema.post("save", handleMongooseError);

export const Game = model("game", GameSchema);
