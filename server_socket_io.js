import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { Game } from "./models/gameModel.js";
import { createNewGame } from "./services/gameService.js";

export const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Use Stream of MongoDB
// Tracking changes the Game-collection in mongodb
const changeStream = Game.watch();
changeStream.on("change", change => {
  console.log("Зміни в БД");

  // Надсилаємо подію клієнтам лише при видаленні
  if (change.operationType === "delete") {
    io.emit("dbUpdateGamesColl", change);
  }
});

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
        return p._id.toString() === player._id.toString(); // convert object to string and compare

        // p._id.equals(player._id); // compare objects of Schema.Types.ObjectId
        // p.userId === player._id; // compare strings

        // convert string to object and compare:
        // import { Schema, model } from "mongoose";
        // p._id.equals(new mongoose.Types.ObjectId(player._id));
      });

      // if game not started only host can start it
      if (!game.isGameStarted) {
        // check if the player is the host
        if (game.hostPlayerId !== player._id)
          return socket.emit("error", {
            message: "Game still not started. Only host can start the game",
          });

        game.isGameStarted = true;
      } else if (isPlayerExists)
        return socket.emit("error", {
          message: "You already joined to this game",
        });

      game.players.push(player);
      await game.save();

      socket.join(gameId);
      io.to(gameId).emit("updateGame", game);
    } catch (err) {
      console.error("Error processing game action:", err);
      emitError("Server error");
    }
  };

  const handleDeleteGame = async gameId => {
    try {
      const deletedGame = await Game.findByIdAndDelete(gameId);

      // io.emit("currentGameWasDeleted", deletedGame);
    } catch (err) {
      console.error("Error creating game:", err);
      emitError("Server error");
    }
  };

  socket.on("createGame", handleCreateGame);
  socket.on("startOrJoinToGame", handleStartOrJoinToGame);
  socket.on("deleteGame", handleDeleteGame);

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
