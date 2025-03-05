import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const newPlayersOrder = async ({ updatedGame, socket, io }) => {
  console.log("newPlayersOrder");
  const event = "playersOrderUpdated";
  try {
    const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.log("Error players order update:", err);
    socketEmitError({
      errorMessage: "Error players order update",
      socket,
    });
  }
}; //* OK
