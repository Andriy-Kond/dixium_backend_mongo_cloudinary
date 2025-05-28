import { Game } from "../../models/gameModel.js";
import { User } from "../../models/userModel.js";
import { FINISH } from "../../utils/generals/constants.js";
import { socketEmitError } from "../socketEmitError.js";

export const userActiveGameIdClear = async ({ userId, socket }) => {
  console.log("userActiveGameIdClear");

  try {
    const user = await User.findById(userId);
    if (!user)
      return socketEmitError({
        errorMessage: `User with userId ${userId} not found`,
        socket,
      });

    user.userActiveGameId = null;
    user.save();

    // Clear userActiveGameId for all in room
    socket.emit("UserActiveGameId_Updated", { userActiveGameId: null });
  } catch (err) {
    console.log("Server error: Cannot clear userActiveGameId", err);
    socketEmitError({
      errorMessage: "Server error: Cannot clear userActiveGameId ",
      socket,
    });
  }
};
