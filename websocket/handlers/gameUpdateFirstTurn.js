import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameUpdateFirstTurn = async ({ updatedGame, socket, io }) => {
  console.log("handleGameUpdate");
  console.log(" gameUpdate >> updatedGame:::", updatedGame.isFirstTurn);

  const event = "gameFirstTurnUpdated";
  try {
    const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    socket.emit(event, { game });
  } catch (err) {
    console.error("Error in handling game update:", err);
    socketEmitError({
      errorMessage: "Error in handling game update.",
      socket,
    });
  }
};
