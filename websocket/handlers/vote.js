import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const vote = async ({ updatedGame, socket, io }) => {
  console.log("vote");
  const event = "playerVoteSuccess";

  try {
    const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
