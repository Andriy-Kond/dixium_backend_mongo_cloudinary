import { Game } from "../models/gameModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

import { createNewGame } from "../services/gameService.js";

const getAllGames = async (req, res) => {
  console.log("get all games");
  const games = await Game.find();

  res.json(games);
};

const createGame = async (req, res) => {
  console.log("creating new game");

  // opt.1
  // const newGame = await Game.create(req.body); // First db query
  // newGame.gameName = generateGameName();
  // newGame.gameTitle = getRandomItem(newGame.deck).url;
  // await newGame.save(); // Second db query

  // opt.2
  // const newGame = new Game(req.body);
  // newGame.gameName = generateGameName();
  // newGame.gameTitle = getRandomItem(newGame.deck).url;
  // await newGame.save(); // One single db query

  // opt.2.1
  const newGame = await createNewGame(req.body);

  res.status(201).json(newGame);
};

export const gameController = {
  getAllGames: tryCatchDecorator(getAllGames),
  createGame: tryCatchDecorator(createGame),
};
