import { findGameOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const setFirstStoryteller = async ({ updatedGame, socket, io }) => {
  console.log("setFirstStoryteller");

  const event = "firstStorytellerUpdated";
  try {
    const game = await findGameOrFail(updatedGame._id, socket);
    // const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    // Якщо оповідач уже встановлений, відхиляємо запит
    if (game.storytellerId) {
      console.log("Storyteller already set");
      socketEmitError({ errorMessage: "Storyteller already set", socket });

      return;
    }

    // Object.assign(game, { ...updatedGame });
    game.set({ ...updatedGame }); // альтернатива Object.assign у mongooseDB
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
