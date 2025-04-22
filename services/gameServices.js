import { Game } from "../models/gameModel.js";
import { socketEmitError } from "../websocket/socketEmitError.js";
import { generateGameName } from "../utils/generateGameName.js";
import { getRandomItem } from "../utils/getRandomItem.js";
import {
  LOBBY,
  GUESSING,
  VOTING,
  ROUND_RESULTS,
  FINISH,
} from "../utils/generals/constants.js";
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

// Пошук незавершеної гри
async function gameFindActiveCurrent(searchGameNumber) {
  const game = await Game.findOne({
    playerGameId: Number(searchGameNumber),
    gameStatus: { $in: [LOBBY, GUESSING, VOTING, ROUND_RESULTS] }, // Шукаю лише активні ігри
  });

  if (!game) {
    throw HttpError({
      status: 404,
      message: `Game with number ${searchGameNumber} not found or already finished`,
    });
  }

  return game;
}

// Перевірка, чи гра існує
async function findGameByIdOrFail(gameId) {
  const game = await Game.findById(gameId);
  if (!game)
    return {
      errorMessage: `Error: The game with id ${gameId} not found`,
    };

  // todo: add isGameFinished
  if (game.isGameFinished)
    return {
      errorMessage: `Game with id ${gameId} already finish`,
    };

  return { game };
}

// Перевірка, чи гра існує і її оновлення
async function findGameAndUpdateOrFail(currentGame, socket, event) {
  console.log("findGameAndUpdateOrFail");

  const game = await Game.findByIdAndUpdate(currentGame._id, currentGame, {
    new: true,
  });

  if (!game) {
    // special event for return previous state in event handler on client:
    socketEmitError({ event, socket });
    return null;
  }

  // if (!game) {
  //   // emit "playersOrderUpdated" - for return previous state:
  //   // io.to(room) - for return previous state for all roommates, if will be realizing optimistic update for all clients:
  //   io.to(updatedGame._id).emit("playersOrderUpdated", {
  //   errorMessage: "Server error: Game not found",
  //   });
  //   return null;
  // }

  return game;
}

// Додавання гравця до гри
async function addPlayerToGame(game, player, isPlayerInGame) {
  if (!isPlayerInGame) {
    // player.hand = []; // Встановлюється у GameList на клієнті
    game.players.push(player);
  }

  return game; // ?? нащо?
}

// Приєднання сокета до кімнати
function joinSocketToRoom(socket, gameId, player) {
  socket.join(gameId);
  console.log(
    `Player ${player._id} (socket ${socket.id}) joined room ${gameId}`,
  );
}

// Сповіщення всіх у кімнаті
function notifyRoom({ io, gameId, game, player, isPlayerInGame, message }) {
  io.to(gameId).emit("playerJoined", {
    game,
    player,
    ...(!isPlayerInGame && { message }), // send message only if it first join player to game
  });
}

// Видалення гри
async function findGameAndDeleteOrFail(gameId, socket, event) {
  const game = await Game.findByIdAndDelete(gameId);

  if (!game) {
    socketEmitError({ event, socket });
    return null;
  }

  return game;
}

export {
  createNewGame,
  gameFindActiveCurrent,
  findGameByIdOrFail,
  findGameAndUpdateOrFail,
  addPlayerToGame,
  joinSocketToRoom,
  notifyRoom,
  findGameAndDeleteOrFail,
};
