import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const deleteUserFromGame = async ({ updatedGame, socket, io }) => {
  console.log("deleteUserFromGame");

  const event = "userDeletedFromGame";

  try {
    const game = await findGameAndUpdateOrFail(updatedGame, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    io.emit(event, { game }); // to all
  } catch (err) {
    console.error("Error in handling delete user from game:", err);
    socketEmitError({
      errorMessage: "Error in handling delete user from game.",
      socket,
    });
  }
};
