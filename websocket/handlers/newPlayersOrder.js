import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const newPlayersOrder = async ({ updatedGame, socket, io }) => {
  console.log("newPlayersOrder");
  const event = "playersOrderUpdated";
  try {
    const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.log("Error players order update:", err);
    socketEmitError({
      errorMessage: "Error players order update",
      socket,
    });
  }
};
