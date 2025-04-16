import { createNewGame } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameCreate = async ({ gameData, socket, io }) => {
  console.log("gameCreate");
  try {
    // Створити нову гру.
    const game = await createNewGame(gameData);

    if (!game) throw new Error(`The game is ${game}`);

    // Оповіщення всіх під'єднаних клієнтів про створену гру
    io.emit("gameCreatedOrUpdated", { game, isNew: true }); // Надсилаємо ВСІМ (.emit) нову гру
    console.log(" gameCreate:::", game.gameName);
  } catch (err) {
    console.error("Error creating game:", err);

    socketEmitError({
      errorMessage: `Error creating game: ${err.message}`,
      socket,
    });
  }
};
