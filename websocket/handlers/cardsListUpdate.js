import { Game } from "../../models/gameModel.js";
import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const cardsListUpdate = async ({ updatedGame, socket, io }) => {
  console.log("cardsListUpdate");

  const event = "CardsList_Update_Success";
  try {
    const game = await Game.findById(updatedGame._id);
    if (!game)
      return socketEmitError({
        errorMessage: `Game "${updatedGame.gameName}" (id: ${updatedGame._id}) not found.`,
        socket,
      });
    game.deck = updatedGame.deck;
    await game.save();

    io.to(updatedGame._id).emit(event, { game });
  } catch (err) {
    console.error("Error in handling game update:", err);
    socketEmitError({
      errorMessage: "Error in handling update cardsListUpdate",
      socket,
      event,
    });
  }
};
