import { gameFindActiveCurrent } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameFindActive = async ({ searchGameNumber, socket, io }) => {
  console.log("gameFindActive");
  try {
    const game = await gameFindActiveCurrent(searchGameNumber);
    // if (!game) throw new Error(`The active game not found: ${game}`);
    if (!game)
      io.emit("gameFindActiveSuccess", {
        gameNumber: searchGameNumber,
        message: `A game with number ${searchGameNumber} not found`,
      });
    else io.emit("gameFindActiveSuccess", { game });
  } catch (err) {
    console.error("Error finding game:", err);
    socketEmitError({
      errorMessage: "Server error: finding game error",
      socket,
    });
  }
};
