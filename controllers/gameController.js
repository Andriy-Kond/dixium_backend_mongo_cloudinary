import { Game } from "../models/gameModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const getGames = async (req, res) => {
  console.log("get all games");
  const games = await Game.find();

  res.json(games);
};

const createGame = async (req, res) => {
  console.log("creating new game");
  const newGame = await Game.create(req.body);

  res.status(201).json(newGame);
};

export const gameController = {
  getGames: tryCatchDecorator(getGames),
  createGame: tryCatchDecorator(createGame),
};
