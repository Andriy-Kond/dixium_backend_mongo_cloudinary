import { createNewGame } from "../services/gameService.js";
import { io } from "./server_socket_io.js";

export const handleCreateGame = async gameData => {
  try {
    const newGame = await createNewGame(gameData);

    // Оповіщення всіх під'єднаних клієнтів про створену гру
    io.emit("newGameCreated", newGame); // Надсилаємо ВСІМ (.emit) оновлений список ігор
  } catch (err) {
    console.error("Error creating game:", err);
    socketEmitError({ message: "Server error: creating game error" });
  }
};
