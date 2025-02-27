import { Game } from "../models/gameModel.js";
import { io } from "./server_socket_io.js";
import { socketEmitError } from "./socketEmitError.js";

export const handleNewPlayersOrder = async updatedGame => {
  try {
    const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
      new: true,
    });

    if (!game)
      return io.to(updatedGame._id).emit("playersOrderUpdated", {
        message: "Server error: Game not found",
      });

    io.to(updatedGame._id).emit("playersOrderUpdated", game);
  } catch (err) {
    console.log("Error players order update:", err);
    socketEmitError({
      message: "Server error: players order not changed",
    });
  }
};
