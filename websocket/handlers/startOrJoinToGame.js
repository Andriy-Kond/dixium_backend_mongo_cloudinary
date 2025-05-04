// import { User } from "../../models/userModel.js";
// import { findGameByIdOrFail } from "../../services/gameServices.js";
// import { socketEmitError } from "../socketEmitError.js";

// export const startOrJoinToGame = async ({ gameId, player, socket, io }) => {
//   console.log("startOrJoinToGame");

//   try {
//     const { game, errorMessage } = await findGameByIdOrFail(gameId);
//     if (errorMessage) return socketEmitError({ errorMessage, socket });

//     //* If game not started only host can start it
//     if (!game.isGameStarted) {
//       // check if the player is the host
//       if (game.hostPlayerId.toString() !== player._id.toString())
//         return socketEmitError({
//           errorMessage: "Game still not started. Only host can start the game",
//           socket,
//         });

//       game.isGameStarted = true;
//       // await game.save();

//       // // Для гравців які знайшли гру, але ще не приєднались, щоб активувалась кнопка "приєднатись до гри" (у v1.0)
//       // io.emit("Game_Started", { game });
//     }

//     // ===== Приєднання плеєра до гри =====
//     const isPlayerInGame = game.players.some(
//       p => p._id.toString() === player._id.toString(),
//     );

//     //* Add player to game if he still not in game
//     if (!isPlayerInGame) game.players.push(player);
//     await game.save();

//     //* update field userActiveGameId
//     const user = await User.findById(player._id);
//     if (!user) {
//       return socketEmitError({
//         errorMessage: `User with id ${player._id} not found`,
//         socket,
//       });
//     }
//     user.userActiveGameId = gameId;
//     await user.save();

//     socket.emit("UserActiveGameId_Updated", {
//       userActiveGameId: user.userActiveGameId,
//     });

//     //* Приєдную сокет поточного плеєра до кімнати
//     // joinSocketToRoom(socket, gameId, player);
//     // socket.join(gameId);

//     console.log(`Joining room with gameId: ${gameId.toString()}`);
//     socket.join(gameId.toString());
//     console.log(`Socket ${socket.id} rooms:`, socket.rooms);
//     // update game for all users
//     // io.emit("playerStartOrJoinToGame", { game, player });

//     //* Notify room
//     console.log(
//       `Room sockets:`,
//       io.sockets.adapter.rooms.get(gameId.toString()),
//     );

//     io.to(gameId).emit("playerJoined", {
//       game,
//       player,
//       ...(!isPlayerInGame && {
//         message: `Player ${player.name.toUpperCase()} joined to game`,
//       }), // send message only if it first join player to game
//     });
//   } catch (err) {
//     console.log("Error start or join to game action:", err);
//     socketEmitError({
//       errorMessage: "Server error: Error start or join to game action",
//       socket,
//     });
//   }
// };
