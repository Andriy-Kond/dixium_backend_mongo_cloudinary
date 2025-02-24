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
      if (!game)
        return socket.emit("error", {
          message: "Server error: Game not found",
        });

      const isPlayerExists = game.players.some(
        p => p._id.toString() === player._id.toString(),
      );

      // if game not started only host can start it
      if (!game.isGameStarted) {
        // check if the player is the host
        if (game.hostPlayerId !== player._id)
          return socket.emit("error", {
            message: "Game still not started. Only host can start the game",
          });

        game.isGameStarted = true;
      } else if (isPlayerExists) {
        return socket.emit("playerJoined", { game }); // On client side redirect to started game page
        // return socket.emit("error", {
        //   message: "You already joined to this game",
        // });
      }
      player.hand = [];
      game.players.push(player);
      await game.save();
      console.log("handleStartOrJoinToGame >> game:::", game);
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
      if (!game) {
        const error = {
          message: "Server error: Game not found",
        };

        return io.to(gameId).emit("playersOrderUpdated", error);
      }

      game.players = players;
      await game.save();

      io.to(gameId).emit("playersOrderUpdated", game);
    } catch (err) {
      console.error("Error players order update:", err);
      emitError("Server error");
    }
  };

  const handleCurrentGameRun = async currentGame => {
    const updatedGame = await Game.findByIdAndUpdate(
      currentGame._id,
      currentGame,
      { new: true },
    );

    if (!updatedGame)
      return socket.emit("currentGame:running", {
        message: "Server error: Game not found",
      });

    io.to(currentGame._id).emit("currentGame:running", updatedGame);
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
