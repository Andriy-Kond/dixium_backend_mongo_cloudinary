import { Game } from "../../models/gameModel.js";
import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const newPlayersOrder = async ({ updatedGame, socket, io }) => {
  console.log("newPlayersOrder");
  const event = "playersOrderUpdated";
  try {
    const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
      new: true,
    });

    if (!game) {
      return socketEmitError({
        errorMessage: `Game ${updatedGame.gameName} (id: ${updatedGame._id}) not found`,
        socket,
        event,
      });
    }

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.log("Error players order update:", err);
    socketEmitError({
      errorMessage: "Error players order update",
      socket,
      event,
    });
  }
};
