import { Game } from "../models/gameModel.js";
import { socketEmitError } from "./socketEmitError.js";

// Перевірка, чи гра існує
async function findGameOrFail(gameId, socket) {
  const game = await Game.findById(gameId);
  if (!game) {
    socketEmitError({ message: "Server error: Game not found", socket });
    return null;
  }

  // todo:
  if (game.isGameFinished) {
    socketEmitError({ message: "Game already finish", socket });
    return null;
  }

  return game;
}

// Додавання гравця до гри
async function addPlayerToGame(game, player, isPlayerInGame) {
  if (!isPlayerInGame) {
    player.hand = [];
    game.players.push(player);
    await game.save();
  }
  return game; // нащо?
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

export { findGameOrFail, addPlayerToGame, joinSocketToRoom, notifyRoom };
