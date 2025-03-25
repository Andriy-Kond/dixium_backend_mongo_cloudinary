import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const startNewRound = async ({ updatedGame, socket, io }) => {
  console.log("startNewRound");
  const event = "startNewRoundSuccess";

  try {
    const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
