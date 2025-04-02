import { Game } from "../models/gameModel.js";
import { socketEmitError } from "../websocket/socketEmitError.js";
import { generateGameName } from "../utils/generateGameName.js";
import { getRandomItem } from "../utils/getRandomItem.js";

// Створення нової гри
async function createNewGame(gameData) {
  const newGame = new Game(gameData);

  newGame.gameName = generateGameName();
  newGame.gamePoster = getRandomItem(newGame.deck).public_id;
  await newGame.save();

  return newGame;
}

// Перевірка, чи гра існує
async function findGameOrFail(gameId, socket) {
  const game = await Game.findById(gameId);
  if (!game) {
    socketEmitError({ socket });
    return null;
  }

  // todo:
  if (game.isGameFinished) {
    socketEmitError({ errorMessage: "Game already finish", socket });
    return null;
  }

  return game;
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
  findGameOrFail,
  findGameAndUpdateOrFail,
  addPlayerToGame,
  joinSocketToRoom,
  notifyRoom,
  findGameAndDeleteOrFail,
};
