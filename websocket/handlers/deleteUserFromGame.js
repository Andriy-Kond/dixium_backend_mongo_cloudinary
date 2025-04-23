import { User } from "../../models/userModel.js";
import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

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
        errorMessage: `User with id ${deletedUserId} not found`,
        socket,
      });
    } else {
      deletedUser.userActiveGameId = "";
      await deletedUser.save();
    }

    //send to all in room for delete player from current game (deleted user still in room)
    io.to(updatedGame._id).emit("userDeletedFromGame", { game, deletedUser });
    // socket.emit("updateUserCredentials", { deletedUser }); // update user credentials of room users
  } catch (err) {
    console.error("Error in handling delete user from game:", err);
    socketEmitError({
      errorMessage: "Error: cannot delete user (deleteUserFromGame)",
      socket,
    });
  }
};
