import mongoose from "mongoose";

const mongooseGameSchema = new mongoose.Schema({
  players: [{ type: String }],
  cards: [{ url: String, owner: String }],
});

export const Game = mongoose.model("game", mongooseGameSchema);
