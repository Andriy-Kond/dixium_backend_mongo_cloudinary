import { Game } from "../models/gameModel.js";
import { io } from "./server_socket_io.js";
import { socketEmitError } from "./socketEmitError.js";

export const handleDeleteGame = async gameId => {
  try {
    const deletedGame = await Game.findByIdAndDelete(gameId);

    if (!deletedGame)
      return io.to(gameId).emit("currentGameWasDeleted", {
        message: "Server error: cannot to delete game",
      });

    io.emit("currentGameWasDeleted", deletedGame);
  } catch (err) {
    console.log("Server error: Cannot delete game", err);
    socketEmitError({ message: "Server error: Cannot delete game" });
  }
};
