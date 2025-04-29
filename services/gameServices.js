import { Game } from "../models/gameModel.js";
import { generateGameName } from "../utils/generateGameName.js";
import { getRandomItem } from "../utils/getRandomItem.js";
import { FINISH } from "../utils/generals/constants.js";
import { HttpError } from "../utils/HttpError.js";
import { User } from "../models/userModel.js";

// Створення нової гри
async function createNewGame(gameData) {
  console.log("createNewGame");

  const user = await User.findById(gameData.hostPlayerId);
  if (!user)
    return {
      errorMessage: `User with hostPlayerId ${gameData.hostPlayerId} not found`,
    };

  // Перевірка, чи у гравця вже є активна гра
  const activeGame = await Game.findOne({
    playerGameId: user.playerGameId,
  });

  if (activeGame && activeGame.status !== FINISH) {
    throw HttpError({
      status: 409,
      message: "You already have an active game. Finish or delete it first.",
    });
  }

  const newGame = new Game(gameData);
  newGame.gameName = generateGameName();
  newGame.gamePoster = getRandomItem(newGame.deck).public_id;
  newGame.playerGameId = user.playerGameId;
  await newGame.save();

  return { game: newGame };
}

// Перевірка, чи гра існує
async function findGameByIdOrFail(gameId) {
  console.log(" findGameByIdOrFail >> gameId:::", gameId);
  console.log("findGameByIdOrFail");
  const game = await Game.findById(gameId);
  if (!game)
    return {
      errorMessage: `Error: The game with id ${gameId} not found!`,
    };

  // todo: add isGameFinished
  if (game.isGameFinished)
    return {
      errorMessage: `Game with id ${gameId} already finish`,
    };

  return { game };
}

// Перевірка, чи гра існує і її оновлення
async function findGameAndUpdateOrFail(updatedGame) {
  console.log("findGameAndUpdateOrFail");

  const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
    new: true,
  });

  if (!game)
    return {
      errorMessage: `Cannot update game with updatedGame._id ${updatedGame._id}`,
      // special event for return previous state in event handler on client:
      // socketEmitError({ event, socket });
      // return null;
    };

  // if (!game) {
  //   // emit "playersOrderUpdated" - for return previous state:
  //   // io.to(room) - for return previous state for all roommates, if will be realizing optimistic update for all clients:
  //   io.to(updatedGame._id).emit("playersOrderUpdated", {
  //   errorMessage: "Server error: Game not found",
  //   });
  //   return null;
  // }
  return { game };
}

export { createNewGame, findGameByIdOrFail, findGameAndUpdateOrFail };
