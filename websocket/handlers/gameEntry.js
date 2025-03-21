import {
  addPlayerToGame,
  findGameOrFail,
  joinSocketToRoom,
  notifyRoom,
} from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameEntry = async ({ gameId, player, socket, io }) => {
  console.log("gameEntry");

  try {
    const game = await findGameOrFail(gameId, socket);
    if (!game) throw new Error(`The game is ${game}`);

    // If game not started only host can start it
    if (!game.isGameStarted) {
      // check if the player is the host
      if (game.hostPlayerId !== player._id) {
        return socketEmitError({
          errorMessage: "Game still not started. Only host can start the game",
          socket,
        });
      }
      game.isGameStarted = true;
    }

    const isPlayerInGame = game.players.some(
      p => p._id.toString() === player._id.toString(),
    );

    // Add player if he still not in game
    await addPlayerToGame(game, player, isPlayerInGame);
    await game.save();

    // Приєднуємо сокет до кімнати
    joinSocketToRoom(socket, gameId, player);

    // Оновлюємо гру для всіх і сповіщаємо кімнату
    io.emit("gameCreatedOrUpdated", { game, player });

    notifyRoom({
      io,
      game,
      gameId,
      player,
      isPlayerInGame,
      message: `Player ${player.name.toUpperCase()} joined to game`,
    });
  } catch (err) {
    console.log("Error start or join to game action:", err);
    socketEmitError({
      errorMessage: "Server error: Error start or join to game action",
      socket,
    });
  }
};
