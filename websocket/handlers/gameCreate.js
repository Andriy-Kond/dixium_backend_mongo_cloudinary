import { createNewGame } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameCreate = async ({ gameData, socket, io }) => {
  console.log("gameCreate");
  try {
    const game = await createNewGame(gameData);
    if (!game) throw new Error(`The game is ${game}`);

    // Оповіщення всіх під'єднаних клієнтів про створену гру
    io.emit("gameCreatedOrUpdated", { game, isNew: true }); // Надсилаємо ВСІМ (.emit) нову гру
  } catch (err) {
    console.error("Error creating game:", err);
    socketEmitError({
      errorMessage: "Server error: creating game error",
      socket,
    });
  }
};
