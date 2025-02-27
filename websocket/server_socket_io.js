import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "../app.js";
import { Game } from "../models/gameModel.js";
import { createNewGame } from "../services/gameService.js";

export const httpServer = createServer(app);
export const io = new Server(httpServer, { cors: { origin: "*" } });

// Middleware для доступу до io в контролерах
app.use((req, res, next) => {
  req.io = io;
  next();
});

const changeStream = Game.watch();
// changeStream.on("change", change => {
//   // console.log("change:::", change);
//   console.log(
//     "change.updateDescription.updatedFields :>> ",
//     change?.updateDescription?.updatedFields,
//   );
//   console.log("Зміни в БД");

//   switch (change.operationType) {
//     case "delete":
//       console.log("delete :>> ");
//       // io.emit("delete", change);
//       break;
//     case "insert":
//       console.log("insert :>> ");
//       // io.emit("insert", change);
//       handleCreateGame(gameData);
//       break;
//     case "update":
//       const updatedFields = Object.keys(change.updateDescription.updatedFields);

//       if (updatedFields.includes("isGameRunning")) {
//         console.log(" updatedFields :>>isGameRunning ");
//         handleNewPlayersOrder();
//       }

//       if (updatedFields.includes("players")) {
//         // Перший гравець передається як об'єкт у масиві players:
//         if (Array.isArray(updatedFields.players)) {
//           newPlayer = updatedFields.players.at(-1); // Останній гравець у масиві
//         } else {
//           // Наступні гравці передаються як окремі об'єкти - частинки масиву players, але після ключу "players.1:{}" для другого гравця, "players.2:{} для третього гравця тощо"
//           // Шукаємо поле 'players.X'
//           const playerKey = Object.keys(updatedFields).find(key =>
//             key.startsWith("players."),
//           );
//           if (playerKey) {
//             newPlayer = updatedFields[playerKey];
//           }
//         }

//         if (newPlayer) {
//           console.log(`Новий гравець: ${newPlayer.name}`);
//           // Передати `newPlayer` всім клієнтам
//           handleStartOrJoinToGame({
//             gameId: change.documentKey,
//             player: newPlayer,
//           });
//           // io.emit("updateGame", {
//           //   gameId: change.documentKey._id,
//           //   eventType: "PLAYER_JOINED",
//           // });
//         }
//       }

//       if (updatedFields.includes("isGameStarted")) {
//         io.emit("updateGame", {
//           gameId: change.documentKey._id,
//           eventType: "GAME_STARTED",
//         });
//       }
//       // io.emit("update", change);
//       break;
//     default:
//       io.emit("unknown", { message: "Unknown DB event" });
//   }
// });

io.on("connection", socket => {
  console.log(`User connected: ${socket.id}`);

  // socket.on("checkConnection", () => {
  //   console.log(`Connection check from: ${socket.id}`);
  //   socket.emit("connectionConfirmed"); // Відправляємо підтвердження клієнту
  // });

  // socket.on("joinGame", gameId => {
  //   socket.join(gameId);
  //   console.log(`Socket ${socket.id} joined to room ${gameId}`);
  // });

  const handleCurrentGameUpdate = () => {};
  io.emit("currentGame:update", handleCurrentGameUpdate);

  // // send to current user:
  // const socketEmitError = ({ message, event = "error" }) =>
  //   socket.emit(event, { message });

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
      console.log(`Socket ${socket.id} joined to room ${gameId}`);

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
      const game = await Game.findByIdAndDelete(gameId);

      if (!game)
        return io.to(gameId).emit("currentGameWasDeleted", {
          message: "Server error: cannot to delete game",
        });

      io.emit("currentGameWasDeleted", { game });
    } catch (err) {
      console.log("Server error: Cannot delete game", err);
      socketEmitError({ message: "Server error: Cannot delete game" });
    }
  };

  const handleNewPlayersOrder = async updatedGame => {
    console.log("updatedGame._id:::", updatedGame._id);

    try {
      const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
        new: true,
      });

      if (!game)
        return io.to(updatedGame._id).emit("playersOrderUpdated", {
          message: "Server error: Game not found",
        });

      console.log("game._id:::", game._id);
      console.log("Emitted playersOrderUpdated to room:", updatedGame._id);
      io.to(updatedGame._id).emit("playersOrderUpdated", { game });
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

      io.to(updatedGame._id).emit("currentGame:running", game);
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
