import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameRun = async ({ updatedGame, socket, io }) => {
  console.log("handleGameRun");

  const event = "gameRunning";
  if (updatedGame.players.length < 3) {
    socketEmitError({
      errorMessage:
        "Game not started: quantity of players must be from 3 to 12",
      socket,
    });
    return;
  }

  try {
    const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    io.emit(event, { game }); // to all, for disable button "join to game"
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
