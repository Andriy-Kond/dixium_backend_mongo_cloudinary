import { Game } from "../../models/gameModel.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameRun = async ({ updatedGame, socket, io }) => {
  console.log("gameRun");

  const event = "Game_Running";
  if (updatedGame.players.length < 3 || updatedGame.players.length > 12) {
    socketEmitError({
      errorMessage: "Game not started: quantity of players must be 3-12",
      socket,
    });
    return;
  }

  try {
    const game = await Game.findByIdAndUpdate(updatedGame._id, updatedGame, {
      new: true,
    });

    if (!game) {
      socket.emit(event, { updatedGame, message: errorMessage }); // send OLD game!
      // special event for return previous state in event handler on client:

      return socketEmitError({
        errorMessage: `Cannot update game with _id ${updatedGame._id}`,
        socket,
      });
    }

    io.emit(event, { game }); // to all, for disable button "join to game"
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
