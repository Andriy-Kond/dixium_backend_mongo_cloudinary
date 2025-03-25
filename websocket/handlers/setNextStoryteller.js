import { findGameOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const setNextStoryteller = async ({ updatedGame, socket, io }) => {
  console.log("setNextStoryteller");

  const event = "nextStorytellerUpdated";
  try {
    const game = await findGameOrFail(updatedGame._id, socket);
    if (!game) throw new Error(`The game is ${game}`);

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
