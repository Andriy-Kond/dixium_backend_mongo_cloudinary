import { findGameAndDeleteOrFail } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameDelete = async ({ gameId, socket, io }) => {
  console.log("gameDelete");
  const event = "gameWasDeleted";
  try {
    const game = await findGameAndDeleteOrFail(gameId, socket, event);
    if (!game) throw new Error(`The game is ${game}`);

    io.emit(event, { game });
  } catch (err) {
    console.log("Server error: Cannot delete game", err);
    socketEmitError({
      errorMessage: "Server error: Cannot delete game",
      socket,
    });
  }
}; //* OK
