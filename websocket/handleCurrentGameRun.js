import { Game } from "../models/gameModel.js";
import { io } from "./server_socket_io.js";
import { socketEmitError } from "./socketEmitError.js";

export const handleCurrentGameRun = async updatedGame => {
  try {
    const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
      new: true,
    });

    if (!game)
      return io.to(updatedGame._id).emit("currentGame:running", {
        message: "Server error: Game not found",
      });

    io.to(updatedGame._id).emit("currentGame:running", game);
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      message: "Server error occurred. Please try again later.",
      event: "currentGame:running",
    });
  }
};
