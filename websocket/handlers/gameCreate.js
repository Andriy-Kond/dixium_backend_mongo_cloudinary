import { User } from "../../models/userModel.js";
import { createNewGame } from "../../services/gameServices.js";
import { updateUserActiveGameId } from "../../services/userServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameCreate = async ({ gameData, socket, io }) => {
  console.log("gameCreate");

  try {
    // Створити нову гру.
    const { game, errorMessage: userErrMess } = await createNewGame(gameData);
    if (userErrMess)
      return socketEmitError({ errorMessage: userErrMess, socket });

    const { user, errorMessage: gameErrMess } = await updateUserActiveGameId({
      gameId: game._id,
      userId: gameData.hostPlayerId,
    });
    if (gameErrMess)
      return socketEmitError({ errorMessage: gameErrMess, socket });

    // Оповіщення всіх під'єднаних клієнтів про створену гру
    // io.emit("gameCreatedOrUpdated", { game, isNew: true }); // Надсилаємо ВСІМ (.emit) нову гру

    socket.emit("gameCreated", { game }); // send new game to user who created this game
    socket.emit("updateUserCredentials", { user }); // update user credentials

    console.log(" gameCreate:::", game.gameName);
  } catch (err) {
    console.error("Error creating game:", err);
    socketEmitError({
      errorMessage: `Error creating game: ${err.message}`,
      socket,
    });
  }
};
