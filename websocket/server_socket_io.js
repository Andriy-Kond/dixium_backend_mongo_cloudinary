import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "../app.js";
import {
  deleteUserFromGame,
  gameCreate,
  gameDelete,
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
  findAndJoinToGame,
  cardsListUpdate,
  leaveRoom,
  userActiveGameIdClear,
  setFinishPoints,
} from "./handlers/index.js";
// import { registerUserId, userDisconnect } from "./socketUtils.js";
export const httpServer = createServer(app);
export const io = new Server(httpServer, { cors: { origin: "*" } });

// Middleware для доступу до io в контролерах
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", socket => {
  console.log(`User connected: ${socket.id}`);

  // const handleRegisterUserId = ({ userId }) => {
  //   console.log("handleRegisterUserId");
  //   if (!userId) {
  //     console.log(`Received invalid userId: ${userId}`);
  //     return;
  //   }
  //   registerUserId(userId, socket);
  // };

  // const handleUserDisconnect = () => {
  //   console.log("handleUserDisconnect");
  //   console.log(`Socket disconnected, socket.id: ${socket.id}`);
  //   userDisconnect(socket);
  // };

  const handleGameUpdateFirstTurn = async ({ updatedGame }) =>
    gameUpdateFirstTurn({ updatedGame, socket });

  const handleGameCreate = async ({ gameData }) =>
    gameCreate({ gameData, socket, io });

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

  const handleFindAndJoinToGame = async ({ searchGameNumber, player }) =>
    findAndJoinToGame({ searchGameNumber, player, socket, io });

  const handleCardsListUpdate = async ({ updatedGame }) =>
    cardsListUpdate({ updatedGame, socket, io });

  const handleLeaveRoom = async room => leaveRoom({ room, socket, io });
  const handleUserActiveGameIdClear = async ({ userId }) => {
    userActiveGameIdClear({ userId, socket });
  };

  const handleSetFinishPoints = async ({ gameId, finishPoints }) => {
    setFinishPoints({ gameId, finishPoints, socket });
  };

  // const handleStartOrJoinToGame = async ({ gameId, player }) =>
  //   startOrJoinToGame({ gameId, player, socket, io });

  // const handleGameFindActive = async ({ searchGameNumber, initUserId }) =>
  //   gameFindActive({ searchGameNumber, initUserId, socket, io });

  // socket.on("startOrJoinToGame", handleStartOrJoinToGame);
  // socket.on("gameFindActive", handleGameFindActive); // пошук гри (активної)
  // socket.on("registerUserId", handleRegisterUserId);
  // socket.on("disconnect", handleUserDisconnect);
  socket.on("gameUpdateFirstTurn", handleGameUpdateFirstTurn);
  socket.on("Game_Create", handleGameCreate);
  socket.on("deleteUserFromGame", handleDeleteUserFromGame);
  socket.on("Game_Run", handleGameRun);
  socket.on("Game_Delete", handleGameDelete);
  socket.on("joinToGameRoom", handleJoinToGameRoom);
  socket.on("newPlayersOrder", handleNewPlayersOrder);
  socket.on("setFirstStoryteller", handleSetFirstStoryteller);
  socket.on("setNextStoryteller", handleSetNextStoryteller);
  socket.on("playerGuessing", handleGuess);
  socket.on("startVoting", handleStartVoting);
  socket.on("playerVoting", handleVote);
  socket.on("roundFinish", handleRoundFinish);
  socket.on("startNewRound", handleStartNewRound);
  socket.on("findAndJoinToGame_req", handleFindAndJoinToGame); // пошук і приєднання до гри
  socket.on("CardsList_Update", handleCardsListUpdate);
  socket.on("leaveRoom", handleLeaveRoom);
  socket.on("UserActiveGameId_Clear", handleUserActiveGameIdClear);
  socket.on("Set_Finish_Points", handleSetFinishPoints);
});
