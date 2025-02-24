import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { Game } from "./models/gameModel.js";
import { createNewGame } from "./services/gameService.js";

export const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  console.log(`User connected: ${socket.id}`);

  // send to current user:
  const socketEmitError = ({ message, event = "error" }) =>
    socket.emit(event, { message });

  // Обробка створення нової гри (Гравець створює гру)
  const handleCreateGame = async gameData => {
    try {
      const newGame = await createNewGame(gameData);

      // Оповіщення всіх під'єднаних клієнтів про створену гру
      io.emit("newGameCreated", newGame); // Надсилаємо ВСІМ (.emit) оновлений список ігор
    } catch (err) {
      console.error("Error creating game:", err);
      socketEmitError({ message: "Server error: creating game error" });
    }
  };

  const handleStartOrJoinToGame = async ({ gameId, player }) => {
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

  const handleDeleteGame = async gameId => {
    try {
      const deletedGame = await Game.findByIdAndDelete(gameId);

      if (!deletedGame)
        return io.to(gameId).emit("currentGameWasDeleted", {
          message: "Server error: cannot to delete game",
        });

      io.emit("currentGameWasDeleted", deletedGame);
    } catch (err) {
      console.log("Server error: Cannot delete game", err);
      socketEmitError({ message: "Server error: Cannot delete game" });
    }
  };

  const handleNewPlayersOrder = async updatedGame => {
    try {
      const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
        new: true,
      });

      if (!game)
        return io.to(updatedGame._id).emit("playersOrderUpdated", {
          message: "Server error: Game not found",
        });

      io.to(updatedGame._id).emit("playersOrderUpdated", game);
    } catch (err) {
      console.log("Error players order update:", err);
      socketEmitError({
        message: "Server error: players order not changed",
      });
    }
  };

  const handleCurrentGameRun = async updatedGame => {
    try {
      const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
        new: true,
      });

      if (!game)
        return io.to(updatedGame._id).emit("currentGame:running", {
          message: "Server error: Game not found",
        });

      io.to(updatedGame._id).emit("", game);
    } catch (err) {
      console.error("Error in handling current game run:", err);
      socketEmitError({
        message: "Server error occurred. Please try again later.",
        event: "currentGame:running",
      });
    }
  };

  socket.on("createGame", handleCreateGame);
  socket.on("startOrJoinToGame", handleStartOrJoinToGame);
  socket.on("deleteGame", handleDeleteGame);
  socket.on("newPlayersOrder", handleNewPlayersOrder);
  socket.on("currentGame:run", handleCurrentGameRun);

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
