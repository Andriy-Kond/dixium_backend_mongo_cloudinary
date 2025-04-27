import { User } from "../../models/userModel.js";
import { findGameByIdOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const startOrJoinToGame = async ({ gameId, player, socket, io }) => {
  console.log("startOrJoinToGame");

  try {
    const { game, errorMessage } = await findGameByIdOrFail(gameId);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    // If game not started only host can start it
    if (!game.isGameStarted) {
      // check if the player is the host
      if (game.hostPlayerId !== player._id)
        return socketEmitError({
          errorMessage: "Game still not started. Only host can start the game",
          socket,
        });

      game.isGameStarted = true;
    }

    const isPlayerInGame = game.players.some(
      p => p._id.toString() === player._id.toString(),
    );

    // Add player to game if he still not in game
    if (!isPlayerInGame) game.players.push(player);

    await game.save(); // save all changes

    // update field userActiveGameId
    const user = await User.findById(player._id);
    if (!user) {
      return socketEmitError({
        errorMessage: `User with id ${player._id} not found`,
        socket,
      });
    }
    user.userActiveGameId = gameId;
    await user.save();

    // Приєднуємо сокет до кімнати
    // joinSocketToRoom(socket, gameId, player);
    socket.join(gameId);
    console.log(
      `Player ${player._id} (socket ${socket.id}) joined room ${gameId}`,
    );

    // update game for all users
    // io.emit("playerStartOrJoinToGame", { game, player });

    // Notify room
    io.to(gameId).emit("playerJoined", {
      game,
      player,
      ...(!isPlayerInGame && {
        message: `Player ${player.name.toUpperCase()} joined to game`,
      }), // send message only if it first join player to game
    });

    socket.emit("UserActiveGameId:Update", {
      userActiveGameId: user.userActiveGameId,
    });
  } catch (err) {
    console.log("Error start or join to game action:", err);
    socketEmitError({
      errorMessage: "Server error: Error start or join to game action",
      socket,
    });
  }
};
