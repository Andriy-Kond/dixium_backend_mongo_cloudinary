import { Game } from "../../models/gameModel.js";
import { User } from "../../models/userModel.js";
import { socketEmitError } from "../socketEmitError.js";

export const deleteUserFromGame = async ({
  updatedGame,
  deletedUserId,
  socket,
  io,
}) => {
  console.log("deleteUserFromGame");

  try {
    // const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    // if (errorMessage) return socketEmitError({ errorMessage, socket });

    const deletedUser = await User.findById(deletedUserId);
    if (!deletedUser)
      return socketEmitError({
        errorMessage: `Can't delete user: user with id ${deletedUserId} not found`,
        socket,
      });

    const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
      new: true,
    });

    if (!game)
      return socketEmitError({
        errorMessage: `Cannot update game with id ${updatedGame._id}`,
        socket,
      });

    deletedUser.userActiveGameId = null;
    await deletedUser.save();

    // Відправити UserActiveGameId_Updated конкретному користувачу
    // Він вже може бути не у кімнаті, тому відправка типу
    // io.to(room).emit(...);
    // може не спрацювати
    // але може спрацювати така: io.to(userId.toString()).emit("personalEvent", data);
    io.to(deletedUserId).emit("UserActiveGameId_Updated", {
      userActiveGameId: null,
    });

    // // Якщо потрібно видалити всіх користувачів із кімнати, можна перебрати всі сокети в цій кімнаті:
    // const socketsInRoom = io.sockets.adapter.rooms.get(updatedGame._id);
    // if (socketsInRoom) {
    //   for (const socketId of socketsInRoom) {
    //     const socket = io.sockets.sockets.get(socketId);
    //     socket.leave(updatedGame._id);
    //   }
    // }

    // const socketId = getUserSocketId(deletedUserId);
    // if (socketId) {
    //   io.to(socketId).emit("UserActiveGameId_Updated", {
    //     userActiveGameId: null,
    //   });
    // } else {
    //   console.log(`Socket for user ${deletedUserId} not found`);
    // }

    //send to all in room - delete player from current game (deleted user still in room?)
    io.to(updatedGame._id).emit("userDeletedFromGame", { game, deletedUser });
  } catch (err) {
    console.error("Error in handling delete user from game:", err);
    socketEmitError({
      errorMessage: "Error: cannot delete user (deleteUserFromGame)",
      socket,
    });
  }
};
