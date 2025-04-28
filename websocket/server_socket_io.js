import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "../app.js";

import {
  deleteUserFromGame,
  gameCreate,
  gameDelete,
  startOrJoinToGame,
  gameRun,
  gameUpdateFirstTurn,
  joinToGameRoom,
  newPlayersOrder,
  setFirstStoryteller,
  guess,
  startVoting,
  vote,
  roundFinish,
  startNewRound,
  setNextStoryteller,
  gameFindActive,
} from "./handlers/index.js";
import { registerUserId, userDisconnect } from "./socketUtils.js";

export const httpServer = createServer(app);
export const io = new Server(httpServer, { cors: { origin: "*" } });

// Middleware для доступу до io в контролерах
app.use((req, res, next) => {
  req.io = io;
  next();
});

// const changeStream = Game.watch(); // ??? await Game.watch() ???
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

  const handleRegisterUserId = ({ userId }) => {
    console.log("handleRegisterUserId");
    if (!userId) {
      console.warn(`Received invalid userId: ${userId}`);
      console.log(" gameUpdateFirstTurn:::", gameUpdateFirstTurn);
      return;
    }
    registerUserId(userId, socket);
  };

  const handleUserDisconnect = () => {
    console.log("handleUserDisconnect");
    console.log(`Socket disconnected, socket.id: ${socket.id}`);
    userDisconnect(socket);
  };

  const handleGameUpdateFirstTurn = async ({ updatedGame }) =>
    gameUpdateFirstTurn({ updatedGame, socket });

  const handleGameCreate = async ({ gameData }) =>
    gameCreate({ gameData, socket, io });

  const handleStartOrJoinToGame = async ({ gameId, player }) =>
    startOrJoinToGame({ gameId, player, socket, io });

  const handleDeleteUserFromGame = async ({ updatedGame, deletedUserId }) =>
    deleteUserFromGame({ updatedGame, deletedUserId, socket, io });

  const handleGameRun = async ({ updatedGame }) =>
    gameRun({ updatedGame, socket, io });

  const handleGameDelete = async ({ gameId, userId }) =>
    gameDelete({ gameId, userId, socket, io });

  const handleJoinToGameRoom = async ({ gameId, userId }) =>
    joinToGameRoom({ gameId, userId, socket });

  const handleNewPlayersOrder = async ({ updatedGame }) =>
    newPlayersOrder({ updatedGame, socket, io });

  const handleSetFirstStoryteller = async ({ updatedGame }) =>
    setFirstStoryteller({ updatedGame, socket, io });

  const handleSetNextStoryteller = async ({ updatedGame }) =>
    setNextStoryteller({ updatedGame, socket, io });

  const handleGuess = async ({ updatedGame }) =>
    guess({ updatedGame, socket, io });

  const handleStartVoting = async ({ updatedGame }) =>
    startVoting({ updatedGame, socket, io });

  const handleVote = async ({ updatedGame }) =>
    vote({ updatedGame, socket, io });

  const handleRoundFinish = async ({ updatedGame }) =>
    roundFinish({ updatedGame, socket, io });

  const handleStartNewRound = async ({ updatedGame }) =>
    startNewRound({ updatedGame, socket, io });

  const handleGameFindActive = async ({ searchGameNumber, initUserId }) =>
    gameFindActive({ searchGameNumber, initUserId, socket, io });

  socket.on("registerUserId", handleRegisterUserId);
  socket.on("disconnect", handleUserDisconnect);

  socket.on("gameUpdateFirstTurn", handleGameUpdateFirstTurn);
  socket.on("createGame", handleGameCreate);
  socket.on("startOrJoinToGame", handleStartOrJoinToGame);
  socket.on("deleteUserFromGame", handleDeleteUserFromGame);
  socket.on("gameRun", handleGameRun);
  socket.on("Game:Delete", handleGameDelete);
  socket.on("joinToGameRoom", handleJoinToGameRoom);
  socket.on("newPlayersOrder", handleNewPlayersOrder);

  socket.on("setFirstStoryteller", handleSetFirstStoryteller);
  socket.on("setNextStoryteller", handleSetNextStoryteller);
  socket.on("playerGuessing", handleGuess);
  socket.on("startVoting", handleStartVoting);
  socket.on("playerVoting", handleVote);
  socket.on("roundFinish", handleRoundFinish);
  socket.on("startNewRound", handleStartNewRound);

  socket.on("gameFindActive", handleGameFindActive); // пошук гри (активної)

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});
