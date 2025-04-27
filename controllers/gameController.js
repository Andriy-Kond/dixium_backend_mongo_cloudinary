// import { createNewGame } from "../services/gameServices.js";
import { Game } from "../models/gameModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const getAllGames = async (req, res) => {
  console.log("get all games");
  const games = await Game.find();

  const normalizedGames = games.reduce((acc, game) => {
    acc[game._id] = game;
    return acc;
  }, {});

  res.json(normalizedGames);
};

const getCurrentGame = async (req, res) => {
  console.log("get Current Game");
  const game = await Game.findOne({ _id: req.params.id }); // find by game _id

  // console.log(" getCurrentGame >> game:::", game);
  res.json(game);
};

const findGame = async (req, res) => {
  console.log("find Game by playerGameId");
  // console.log("req.params:::", req.params); // req.params::: { playerGameId: '3510' }
  const game = await Game.findOne({ playerGameId: req.params.playerGameId }); // find by playerGameId

  res.json(game);
};

// const createGame = async (req, res) => {
//   console.log("creating new game");

//   // opt.1
//   // const newGame = await Game.create(req.body); // First db query
//   // newGame.gameName = generateGameName();
//   // newGame.gamePoster = getRandomItem(newGame.deck).url;
//   // await newGame.save(); // Second db query

//   // opt.2
//   // const newGame = new Game(req.body);
//   // newGame.gameName = generateGameName();
//   // newGame.gamePoster = getRandomItem(newGame.deck).url;
//   // await newGame.save(); // One single db query

//   // opt.2.1
//   const newGame = await createNewGame(req.body);

//   res.status(200).json(newGame);
// };

// const updateGame = async (req, res) => {
//   const game = await Game.findByIdAndUpdate(req.params.gameId, req.body, {
//     new: true,
//   });
//   // Відправляємо оновлення через сокети всім гравцям
//   req.io.emit("currentGame:update", game); // ??

//   res.status(201).json(game); // send http response to current sender (needs for debugging)
// };

const removeGame = async (req, res) => {
  const deletedGame = await Game.findByIdAndDelete(req.params.id);
  res.status(201).json(deletedGame);
};

export const gameController = {
  getAllGames: tryCatchDecorator(getAllGames),
  getCurrentGame: tryCatchDecorator(getCurrentGame),
  findGame: tryCatchDecorator(findGame),
  removeGame: tryCatchDecorator(removeGame),
};
// updateGame: tryCatchDecorator(updateGame),
// createGame: tryCatchDecorator(createGame),
