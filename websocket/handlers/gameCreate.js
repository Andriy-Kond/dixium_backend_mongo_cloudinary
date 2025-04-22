import { User } from "../../models/userModel.js";
import { createNewGame } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameCreate = async ({ gameData, socket, io }) => {
  console.log("gameCreate");
  try {
    // Створити нову гру.
    const game = await createNewGame(gameData);
    if (!game) throw new Error(`The game is ${game}`);

    const user = await User.findById(gameData.hostPlayerId);
    user.userActiveGameId = game._id;
    await user.save();
    console.log(" gameCreate >> user:::", user);

    // Оповіщення всіх під'єднаних клієнтів про створену гру
    // io.emit("gameCreatedOrUpdated", { game, isNew: true }); // Надсилаємо ВСІМ (.emit) нову гру
    socket.emit("gameCreated", { game, isNew: true });
    socket.emit("updateUserCredentials", { user });

    console.log(" gameCreate:::", game.gameName);
  } catch (err) {
    console.error("Error creating game:", err);

    socketEmitError({
      errorMessage: `Error creating game: ${err.message}`,
      socket,
    });
  }
};
