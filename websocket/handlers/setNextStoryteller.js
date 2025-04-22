import { findGameByIdOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const setNextStoryteller = async ({ updatedGame, socket, io }) => {
  console.log("setNextStoryteller");

  const event = "nextStorytellerUpdated";
  try {
    const { game, errorMessage } = await findGameByIdOrFail(updatedGame._id);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    game.set({ ...updatedGame });
    await game.save();

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.error("Error in handling set first storyteller:", err);
    socketEmitError({
      errorMessage: "Error in handling set first storyteller.",
      socket,
    });
  }
};
