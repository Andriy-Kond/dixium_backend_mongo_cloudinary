import { Game } from "../../models/gameModel.js";
import { User } from "../../models/userModel.js";
import {
  GUESSING,
  LOBBY,
  ROUND_RESULTS,
  VOTING,
} from "../../utils/generals/constants.js";
import { socketEmitError } from "../socketEmitError.js";

export const findAndJoinToGame = async ({
  searchGameNumber,
  player,
  socket,
  io,
}) => {
  console.log("findAndJoinToGame_req");
  const { _id: playerId, name } = player;

  try {
    // Пошук незавершеної гри
    const game = await Game.findOne({
      playerGameId: Number(searchGameNumber),
      gameStatus: { $in: [LOBBY, GUESSING, VOTING, ROUND_RESULTS] }, // Шукаю лише активні ігри
    });

    if (!game) {
      socket.emit("findAndJoinToGame_Success", { game: null });
      return;
    }

    const { _id: gameId } = game;

    // ===== Приєднання плеєра до гри =====
    const isPlayerInGame = game.players.some(
      p => p._id.toString() === playerId.toString(),
    );

    //* Add player to game if he still not in game
    if (!isPlayerInGame) game.players.push(player);
    await game.save();

    //* update field userActiveGameId
    const user = await User.findById(playerId);
    if (!user) {
      return socketEmitError({
        errorMessage: `User with id ${playerId} not found`,
        socket,
      });
    }
    user.userActiveGameId = gameId;
    await user.save();

    //* Приєдную сокет поточного плеєра до кімнати
    const roomId = gameId.toString();
    // console.log(`Joining room with gameId: ${roomId}`);
    socket.join(roomId);
    // console.log(`Socket ${socket.id} rooms:`, socket.rooms);
    // console.log(
    //   `Sockets in room ${roomId}:`,
    //   io.sockets.adapter.rooms.get(roomId)?.size || 0,
    // );

    //* Notify room for not this user (filter on client)
    // console.log(`Room sockets:`, io.sockets.adapter.rooms.get(roomId));
    // console.log(" io.to >> roomId:::", roomId);
    io.to(roomId).emit("playerJoined", {
      game,
      player,
      ...(!isPlayerInGame && {
        message: `Player ${name.toUpperCase()} joined to game. io.to(roomId)`,
      }), // send message only if it first join player to game
    });

    // test:
    io.emit("playerJoined_test", {
      game,
      player,
      ...(!isPlayerInGame && {
        message: `Player ${name.toUpperCase()} joined to game. io.to(roomId)`,
      }), // send message only if it first join player to game
    });

    socket.emit("findAndJoinToGame_Success", { game }); // update game for user who sent this request

    // socket.emit("UserActiveGameId_Updated", {
    //   userActiveGameId: user.userActiveGameId,
    // });
  } catch (err) {
    console.error("Error finding game:", err);
    socketEmitError({
      errorMessage: `Game with number ${searchGameNumber} not found.`,
      socket,
    });
  }
};
