import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const roundFinish = async ({ updatedGame, socket, io }) => {
  console.log("roundFinish");
  const event = "roundFinishSuccess";

  try {
    const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    io.to(updatedGame._id).emit(event, { game });

    console.log(" roundFinish >> game:::", game.scores);

    // Is we can to finish the game?
    const maxScore = Math.max(...game.scores.values());
    console.log(" roundFinish >> maxScore:::", maxScore);
    if (maxScore >= 30) {
      io.to(updatedGame._id).emit("gameEnd", { game });
      console.log("game End");
    }
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
