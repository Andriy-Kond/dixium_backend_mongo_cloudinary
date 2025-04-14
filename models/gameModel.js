import { Schema, model } from "mongoose";
import { handleMongooseError } from "../utils/handleMongooseError.js";
import { CardSchema } from "./cardSchema.js";
import {
  FINISH,
  GUESSING,
  LOBBY,
  ROUND_RESULTS,
  VOTING,
} from "../utils/generals/constants.js";

const GameSchema = new Schema(
  {
    gameName: String, // Game name
    gamePoster: String,
    // gameStatus: String,
    gameStatus: {
      type: String,
      enum: [LOBBY, GUESSING, VOTING, ROUND_RESULTS, FINISH],
      default: LOBBY,
    },

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
        public_id: String,
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

    playerGameId: {
      type: Number,
      required: true,
      unique: true, // Забезпечує, що один гравець може мати лише одну гру
    },
  },

  { versionKey: false, timestamps: true },
);

GameSchema.post("save", handleMongooseError);

export const Game = model("game", GameSchema);
