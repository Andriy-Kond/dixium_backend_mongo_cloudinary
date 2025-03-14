import { findGameOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const setFirstStoryteller = async ({ updatedGame, socket, io }) => {
  console.log("setFirstStoryteller");

  const event = "firstStorytellerUpdated";
  try {
    const gameId = updatedGame._id;
    const game = await findGameOrFail(gameId, socket);
    // const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    if (game.storytellerId) {
      console.log("Storyteller already set");
      return;
    }

    game.set({ ...updatedGame }); // альтернатива Object.assign у mongooseDB
    // Object.assign(game, { ...updatedGame });

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
