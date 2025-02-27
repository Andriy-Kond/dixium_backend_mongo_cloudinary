import { Game } from "../models/gameModel.js";
import { io } from "./server_socket_io.js";
import { socketEmitError } from "./socketEmitError.js";

export const handleStartOrJoinToGame = async ({ gameId, player }) => {
  try {
    const game = await Game.findById(gameId);
    if (!game)
      return socketEmitError({ message: "Server error: Game not found" });

    const isPlayerExists = game.players.some(
      p => p._id.toString() === player._id.toString(),
    );

    // if game not started only host can start it
    if (!game.isGameStarted) {
      // check if the player is the host
      if (game.hostPlayerId !== player._id)
        return socketEmitError({
          message: "Game still not started. Only host can start the game",
        });

      game.isGameStarted = true;
    }

    if (isPlayerExists) {
      return socket.emit("playerJoined", { game }); // On client side redirect to started game page
    }

    player.hand = [];
    game.players.push(player);
    await game.save();
    socket.join(gameId);

    // Update game for all players:
    io.emit("updateGame", game);

    // To all players in room "gameId" for message and redirect
    io.to(gameId).emit("playerJoined", {
      game,
      message: `Player ${player.name.toUpperCase()} joined to game`,
    });
  } catch (err) {
    console.log("Error start or join to game action:", err);
    socketEmitError({
      message: "Server error: Error start or join to game action",
    });
  }
};
