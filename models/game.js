import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  players: [{ type: String }],
  cards: [{ url: String, owner: String }],
});

export const Game = mongoose.model("Game", gameSchema);
