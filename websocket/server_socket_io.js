import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "../app.js";
import { Game } from "../models/gameModel.js";

import { socketEmitError } from "./socketEmitError.js";
import {
  createNewGame,
  addPlayerToGame,
  findGameAndDeleteOrFail,
  findGameAndUpdateOrFail,
  findGameOrFail,
  joinSocketToRoom,
  notifyRoom,
} from "../services/gameServices.js";
import {
  gameCreate,
  gameDelete,
  gameEntry,
  gameRun,
  joinToGame,
  newPlayersOrder,
  setFirstStoryteller,
} from "./handlers/index.js";

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
//       handleGameCreate(gameData);
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

  const handleJoinToGame = async ({ gameId, player }) =>
    joinToGame({ gameId, player, socket }); //* OK

  // const handleJoinToGame = async ({ gameId, player }) => {
  //   try {
  //     const game = await findGameOrFail(gameId, socket);
  //     if (!game) throw new Error(`Game error: the game is ${game}`) ;

  //     // Перевіряємо, чи гравець у грі
  //     const isPlayerInGame = game.players.some(
  //       p => p._id.toString() === player._id.toString(),
  //     );

  //     if (!isPlayerInGame) {
  //       return socketEmitError({
  //         errorMessage: "You are not a player in this game",
  //         socket,
  //       });
  //     }

  //     // Приєднуємо до кімнати
  //     joinSocketToRoom(socket, gameId, player);

  //     // Повідомляємо клієнту, що він перепідключений
  //     // socket.emit("playerReJoined", {
  //     //   game,
  //     //   player,
  //     //   message: `You are rejoined to game room`,
  //     // });
  //   } catch (err) {
  //     console.error("Error joining game room:", err);
  //     socketEmitError({
  //       errorMessage: "Error joining game room",
  //       socket,
  //     });
  //   }
  // }; //* OK

  const handleGameEntry = async ({ gameId, player }) =>
    gameEntry({ gameId, player, socket, io });

  // const handleGameEntry = async ({ gameId, player }) => {
  //   try {
  //     const game = await findGameOrFail(gameId, socket);
  //     if (!game) throw new Error(`Game error: the game is ${game}`) ;

  //     // If game not started only host can start it
  //     if (!game.isGameStarted) {
  //       // check if the player is the host
  //       if (game.hostPlayerId !== player._id) {
  //         return socketEmitError({
  //           errorMessage:
  //             "Game still not started. Only host can start the game",
  //           socket,
  //         });
  //       }
  //       game.isGameStarted = true;
  //     }

  //     const isPlayerInGame = game.players.some(
  //       p => p._id.toString() === player._id.toString(),
  //     );

  //     // Add player if he still not in game
  //     await addPlayerToGame(game, player, isPlayerInGame);

  //     // Приєднуємо сокет до кімнати
  //     joinSocketToRoom(socket, gameId, player);

  //     // Оновлюємо гру для всіх і сповіщаємо кімнату
  //     io.emit("gameChange", { game });

  //     notifyRoom({
  //       io,
  //       game,
  //       gameId,
  //       player,
  //       isPlayerInGame,
  //       message: `Player ${player.name.toUpperCase()} joined to game`,
  //     });
  //   } catch (err) {
  //     console.log("Error start or join to game action:", err);
  //     socketEmitError({
  //       errorMessage: "Server error: Error start or join to game action",
  //       socket,
  //     });
  //   }
  // }; //* OK

  const handleGameCreate = async ({ gameData }) =>
    gameCreate({ gameData, socket, io });

  // Обробка створення нової гри (Гравець створює гру)
  // const handleGameCreate = async ({ gameData }) => {
  //   try {
  //     const game = await createNewGame(gameData);
  //     if (!game) throw new Error(`Game error: the game is ${game}`) ;

  //     // Оповіщення всіх під'єднаних клієнтів про створену гру
  //     io.emit("gameChange", { game, isNew: true }); // Надсилаємо ВСІМ (.emit) нову гру
  //   } catch (err) {
  //     console.error("Error creating game:", err);
  //     socketEmitError({
  //       errorMessage: "Server error: creating game error",
  //       socket,
  //     });
  //   }
  // }; //* OK

  const handleGameDelete = async ({ gameId }) =>
    gameDelete({ gameId, socket, io });

  // const handleGameDelete = async ({ gameId }) => {
  //   const event = "gameWasDeleted";
  //   try {
  //     const game = await findGameAndDeleteOrFail(gameId, socket, event);
  //     if (!game) throw new Error(`Game error: the game is ${game}`) ;

  //     io.emit(event, { game });
  //   } catch (err) {
  //     console.log("Server error: Cannot delete game", err);
  //     socketEmitError({
  //       errorMessage: "Server error: Cannot delete game",
  //       socket,
  //     });
  //   }
  // }; //* OK

  const handleNewPlayersOrder = async ({ updatedGame }) =>
    newPlayersOrder({ updatedGame, socket, io });

  // const handleNewPlayersOrder = async ({ updatedGame }) => {
  //   const event = "playersOrderUpdated";
  //   try {
  //     const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
  //     if (!game) throw new Error(`Game error: the game is ${game}`) ;

  //     io.to(updatedGame._id).emit(event, { game });
  //   } catch (err) {
  //     console.log("Error players order update:", err);
  //     socketEmitError({
  //       errorMessage: "Error players order update",
  //       socket,
  //     });
  //   }
  // }; //* OK

  const handleGameRun = async ({ updatedGame }) =>
    gameRun({ updatedGame, socket, io });

  // const handleGameRun = async ({ updatedGame }) => {
  //   console.log("handleGameRun");

  //   const event = "currentGame:running";
  //   try {
  //     const game = await findGameAndUpdateOrFail(updatedGame, socket, event);

  //     if (!game) throw new Error(`The game is ${game}`);

  //     io.to(updatedGame._id).emit(event, { game });
  //   } catch (err) {
  //     console.error("Error in handling current game run:", err);
  //     socketEmitError({
  //       errorMessage: "Error in handling current game run.",
  //       socket,
  //     });
  //   }
  // }; //* OK

  const handleSetFirstStoryteller = async ({ currentGame, player }) =>
    setFirstStoryteller({
      currentGame,
      player,
      socket,
      io,
    });

  // const handleSetFirstStoryteller = async ({ currentGame, player }) => {
  //   const event = "firstStoryteller:updated";
  //   try {
  //     const game = await findGameAndUpdateOrFail(currentGame, socket, event);
  //     if (!game) throw new Error(`Game error: the game is ${game}`);

  //     io.to(currentGame._id).emit(event, { game });
  //   } catch (err) {
  //     console.error("Error in handling set first storyteller:", err);
  //     socketEmitError({
  //       errorMessage: "Error in handling set first storyteller.",
  //       socket,
  //     });
  //   }
  // }; //* in progress

  socket.on("setFirstStoryteller", handleSetFirstStoryteller);
  socket.on("joinGameRoom", handleJoinToGame);
  socket.on("createGame", handleGameCreate);
  socket.on("startOrJoinToGame", handleGameEntry);
  socket.on("deleteGame", handleGameDelete);
  socket.on("newPlayersOrder", handleNewPlayersOrder);
  socket.on("currentGame:run", handleGameRun);

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
