import {
  findGameByIdOrFail,
  joinSocketToRoom,
} from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const joinToGame = async ({ gameId, player, socket }) => {
  // console.log("joinToGame");
  try {
    const { game, errorMessage } = await findGameByIdOrFail(gameId);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    // Перевіряємо, чи гравець у грі
    const isPlayerInGame = game.players.some(
      p => p._id.toString() === player._id.toString(),
    );

    if (!isPlayerInGame) {
      return socketEmitError({
        errorMessage: "You are not a player in this game",
        socket,
      });
    }

    // Приєднуємо до кімнати
    joinSocketToRoom(socket, gameId, player);

    // Повідомляємо клієнту, що він перепідключений
    // socket.emit("playerReJoined", {
    //   game,
    //   player,
    //   message: `You are rejoined to game room`,
    // });
  } catch (err) {
    console.error("Error joining game room:", err);
    socketEmitError({
      errorMessage: "Error joining game room",
      socket,
    });
  }
};
