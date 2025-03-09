import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameRun = async ({ updatedGame, socket, io }) => {
  console.log("handleGameRun");

  const event = "gameRunning";
  try {
    const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    io.emit(event, { game }); // to all, for disable button "join to game"
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
