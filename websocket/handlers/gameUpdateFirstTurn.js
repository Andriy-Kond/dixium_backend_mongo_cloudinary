import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameUpdateFirstTurn = async ({ updatedGame, socket }) => {
  console.log("gameUpdateFirstTurn");
  console.log(" gameUpdate >> updatedGame:::", updatedGame.isFirstTurn);

  const event = "gameFirstTurnUpdated";
  try {
    const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    socket.emit(event, { game });
  } catch (err) {
    console.error("Error in handling game update:", err);
    socketEmitError({
      errorMessage: "Error in handling game update.",
      socket,
    });
  }
};
