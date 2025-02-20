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

  // Обробка створення нової гри (Гравець створює гру)
  socket.on("createGame", async gameData => {
    try {
      const newGame = await createNewGame(gameData);

      // Оповіщення всіх під'єднаних клієнтів про створену гру
      io.emit("newGameCreated", newGame); // Надсилаємо ВСІМ (.emit) оновлений список ігор
    } catch (err) {
      console.error("Error creating game:", err);
    }
  });

  socket.on("startOrJoinToGame", async ({ gameId, player }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      const isPlayerExists = game.players.some(p => p._id === player._id);

      // if game not started only host can start it
      if (!game.isGameStarted) {
        // check if the player is the host
        if (game.hostPlayerId !== player._id) {
          socket.emit("error", { message: "Only host can start the game" });
          return;
        }
        game.isGameStarted = true;
      } else if (isPlayerExists) {
        socket.emit("error", { message: "You already joined this game" });
        return;
      }

      game.players.push(player);
      await game.save();

      socket.join(gameId);
      io.to(gameId).emit("updateGame", game);
    } catch (err) {
      console.error("Error processing game action:", err);
      socket.emit("error", { message: "Server error" });
    }
  });

  socket.on("deleteGame", async gameId => {
    const deletedGame = await Game.findByIdAndDelete(gameId);
    console.log("deletedGame:::", deletedGame);

    io.emit("currentGameWasDeleted", deletedGame);
  });

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
