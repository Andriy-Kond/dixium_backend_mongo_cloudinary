import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const setFirstStoryteller = async ({
  currentGame,
  player,
  socket,
  io,
}) => {
  console.log("setFirstStoryteller");

  const event = "firstStorytellerUpdated";
  try {
    const game = await findGameAndUpdateOrFail(currentGame, socket, event);
    if (!game) throw new Error(`Game error: the game is ${game}`);

    io.to(currentGame._id).emit(event, { game });
  } catch (err) {
    console.error("Error in handling set first storyteller:", err);
    socketEmitError({
      errorMessage: "Error in handling set first storyteller.",
      socket,
    });
  }
};
