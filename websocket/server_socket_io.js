import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "../app.js";
import { Game } from "../models/gameModel.js";
import { createNewGame } from "../services/gameService.js";
import { socketEmitError } from "./socketEmitError.js";
import {
  addPlayerToGame,
  findGameOrFail,
  joinSocketToRoom,
  notifyRoom,
} from "./utils.js";

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

  const handleRejoinToGame = async ({ gameId, player }) => {
    console.log("player._id :>> ", player._id);
    try {
      const game = await findGameOrFail(gameId, socket);
      if (!game) return;

      // Перевіряємо, чи гравець у грі
      const isPlayerInGame = game.players.some(
        p => p._id.toString() === player._id.toString(),
      );

      if (!isPlayerInGame) {
        return socketEmitError({
          message: "You are not a player in this game",
          socket,
        });
      }

      // Приєднуємо до кімнати
      joinSocketToRoom(socket, gameId, player);

      // Повідомляємо клієнту
      // socket.emit("playerJoinedToRoom", {
      //   game,
      //   message: `Player ${player.name.toUpperCase()} joined to room`,
      // });
    } catch (err) {
      console.error("Error joining game room:", err);
      socketEmitError({ message: "Server error while joining room", socket });
    }
  };

  const handleGameEntry = async ({ gameId, player }) => {
    try {
      const game = await findGameOrFail(gameId, socket);
      if (!game) return;

      // If game not started only host can start it
      if (!game.isGameStarted) {
        // check if the player is the host
        if (game.hostPlayerId !== player._id) {
          return socketEmitError({
            message: "Game still not started. Only host can start the game",
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

      // Приєднуємо сокет до кімнати
      joinSocketToRoom(socket, gameId, player);

      // Оновлюємо гру для всіх і сповіщаємо кімнату
      io.emit("updateGame", game);

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
        message: "Server error: Error start or join to game action",
        socket,
      });
    }
  };

  // Обробка створення нової гри (Гравець створює гру)
  const handleCreateGame = async gameData => {
    try {
      const newGame = await createNewGame(gameData);

      // Оповіщення всіх під'єднаних клієнтів про створену гру
      io.emit("newGameCreated", newGame); // Надсилаємо ВСІМ (.emit) оновлений список ігор
    } catch (err) {
      console.error("Error creating game:", err);
      socketEmitError({ message: "Server error: creating game error", socket });
    }
  };

  const handleDeleteGame = async gameId => {
    try {
      const game = await Game.findByIdAndDelete(gameId);

      if (!game)
        return io.to(gameId).emit("currentGameWasDeleted", {
          message: "Server error: game not found",
        });

      io.emit("currentGameWasDeleted", { game });
    } catch (err) {
      console.log("Server error: Cannot delete game", err);
      socketEmitError({ message: "Server error: Cannot delete game", socket });
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

      io.to(updatedGame._id).emit("playersOrderUpdated", { game });
    } catch (err) {
      console.log("Error players order update:", err);
      socketEmitError({
        message: "Server error: players order not changed",
        socket,
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

      io.to(updatedGame._id).emit("currentGame:running", { game });
    } catch (err) {
      console.error("Error in handling current game run:", err);
      socketEmitError({
        message: "Server error occurred. Please try again later.",
        event: "currentGame:running",
        socket,
      });
    }
  };

  const handleSetFirstStoryteller = async ({ currentGame, player }) => {
    try {
      const game = await Game.findByIdAndUpdate(currentGame._id, currentGame, {
        new: true,
      });

      if (!game)
        return io.to(currentGame._id).emit("error", {
          message: "Server error: Game not found",
        });

      io.to(currentGame._id).emit("firstStoryteller:updated", game);
    } catch (err) {
      console.error("Error in handling set first storyteller:", err);
      socketEmitError({
        message: "Server error occurred. Please try again later.",
        socket,
      });
    }
  };

  socket.on("setFirstStoryteller", handleSetFirstStoryteller);
  socket.on("joinGameRoom", handleRejoinToGame);
  socket.on("createGame", handleCreateGame);
  socket.on("startOrJoinToGame", handleGameEntry);
  socket.on("deleteGame", handleDeleteGame);
  socket.on("newPlayersOrder", handleNewPlayersOrder);
  socket.on("currentGame:run", handleCurrentGameRun);

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
