import { Game } from "../models/gameModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

import { createNewGame } from "../services/gameServices.js";

const getAllGames = async (req, res) => {
  console.log("get all games");
  const games = await Game.find();

  res.json(games);
};

const getCurrentGame = async (req, res) => {
  const game = await Game.findById(req.params.id);

  res.json(game);
};

const createGame = async (req, res) => {
  console.log("creating new game");

  // opt.1
  // const newGame = await Game.create(req.body); // First db query
  // newGame.gameName = generateGameName();
  // newGame.gamePoster = getRandomItem(newGame.deck).url;
  // await newGame.save(); // Second db query

  // opt.2
  // const newGame = new Game(req.body);
  // newGame.gameName = generateGameName();
  // newGame.gamePoster = getRandomItem(newGame.deck).url;
  // await newGame.save(); // One single db query

  // opt.2.1
  const newGame = await createNewGame(req.body);

  res.status(200).json(newGame);
};

const updateGame = async (req, res) => {
  const game = await Game.findByIdAndUpdate(req.params.gameId, req.body, {
    new: true,
  });
  // Відправляємо оновлення через сокети всім гравцям
  req.io.emit("currentGame:update", game); // ??

  res.status(201).json(game); // send http response to current sender (needs for debugging)
};

const removeGame = async (req, res) => {
  const deletedGame = await Game.findByIdAndDelete(req.params.id);
  res.status(201).json(deletedGame);
};

export const gameController = {
  getAllGames: tryCatchDecorator(getAllGames),
  getCurrentGame: tryCatchDecorator(getCurrentGame),
  createGame: tryCatchDecorator(createGame),
  removeGame: tryCatchDecorator(removeGame),
  updateGame: tryCatchDecorator(updateGame),
};
