import { User } from "../../models/userModel.js";
import { findGameAndDeleteOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameDelete = async ({ gameId, userId, socket, io }) => {
  console.log("gameDelete");
  const event = "gameWasDeleted";
  try {
    const game = await findGameAndDeleteOrFail(gameId, socket, event);

    if (!game) throw new Error(`The game is ${game}`);

    const user = await User.findById(userId);
    user.userActiveGameId = "";
    await user.save();

    io.emit(event, { game });
    socket.emit("updateUserCredentials", { user });
  } catch (err) {
    console.log("Server error: Cannot delete game", err);
    socketEmitError({
      errorMessage: "Server error: Cannot delete game",
      socket,
    });
  }
};
