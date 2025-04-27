import { User } from "../../models/userModel.js";
import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";
import { emitUserActiveGameIdUpdate } from "../socketUtils.js";

export const deleteUserFromGame = async ({
  updatedGame,
  deletedUserId,
  socket,
  io,
}) => {
  console.log("deleteUserFromGame");

  try {
    const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    const deletedUser = await User.findById(deletedUserId);
    if (!deletedUser) {
      socketEmitError({
        errorMessage: `Can't delete user: user with id ${deletedUserId} not found`,
        socket,
      });
    }
    deletedUser.userActiveGameId = null;
    await deletedUser.save();

    // Відправити UserActiveGameId:Update конкретному користувачу
    const socketId = getUserSocketIds(deletedUserId);
    if (socketId) {
      io.to(socketId).emit("UserActiveGameId:Update", {
        userActiveGameId: null,
      });
    } else {
      console.log(`Socket for user ${deletedUserId} not found`);
    }

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
