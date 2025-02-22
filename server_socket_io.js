import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { Game } from "./models/gameModel.js";
import { createNewGame } from "./services/gameService.js";

export const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  console.log(`User connected: ${socket.id}`);

  const emitError = message => socket.emit("error", { message });

  // Обробка створення нової гри (Гравець створює гру)
  const handleCreateGame = async gameData => {
    try {
      const newGame = await createNewGame(gameData);

      // Оповіщення всіх під'єднаних клієнтів про створену гру
      io.emit("newGameCreated", newGame); // Надсилаємо ВСІМ (.emit) оновлений список ігор
    } catch (err) {
      console.error("Error creating game:", err);
      emitError("Server error");
    }
  };

  const handleStartOrJoinToGame = async ({ gameId, player }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return socket.emit("error", { message: "Game not found" });

      const isPlayerExists = game.players.some(p => {
        return p._id.toString() === player._id.toString();
      });

      // if game not started only host can start it
      if (!game.isGameStarted) {
        // check if the player is the host
        if (game.hostPlayerId !== player._id)
          return socket.emit("error", {
            message: "Game still not started. Only host can start the game",
          });

        game.isGameStarted = true;
      } else if (isPlayerExists) {
        return socket.emit("playerJoined", { game });
        // return socket.emit("error", {
        //   message: "You already joined to this game",
        // });
      }

      game.players.push(player);
      await game.save();
      socket.join(gameId);

      // Update game for all players:
      io.emit("updateGame", game);

      // To all players in room "gameId" for message and redirect
      io.to(gameId).emit("playerJoined", {
        game,
        message: `Player ${player.name.toUpperCase()} joined to this game`,
      });
    } catch (err) {
      console.error("Error start or join to game action:", err);
      emitError("Server error");
    }
  };

  const handleDeleteGame = async gameId => {
    try {
      const deletedGame = await Game.findByIdAndDelete(gameId);

      if (!deletedGame)
        return io.to(gameId).emit("error", {
          message: "Server error: cannot to delete game",
        });

      io.emit("currentGameWasDeleted", deletedGame);
    } catch (err) {
      console.error("Error deleting game:", err);
      emitError("Server error");
    }
  };

  const handleNewPlayersOrder = async ({ gameId, players }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game)
        return io.to(gameId).emit("error", {
          message: "Server error: Game not found",
        });

      game.players = players;
      await game.save();

      io.to(gameId).emit("playersOrderUpdated", game);
    } catch (err) {
      console.error("Error players order update:", err);
      emitError("Server error");
    }
  };

  socket.on("createGame", handleCreateGame);
  socket.on("startOrJoinToGame", handleStartOrJoinToGame);
  socket.on("deleteGame", handleDeleteGame);
  socket.on("newPlayersOrder", handleNewPlayersOrder);

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
