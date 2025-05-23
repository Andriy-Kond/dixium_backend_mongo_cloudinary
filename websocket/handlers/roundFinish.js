import { User } from "../../models/userModel.js";
import { findGameAndUpdateOrFail } from "../../services/gameServices.js";
import { FINISH } from "../../utils/generals/constants.js";
import { socketEmitError } from "../socketEmitError.js";

export const roundFinish = async ({ updatedGame, socket, io }) => {
  console.log("roundFinish");
  const event = "roundFinishSuccess";

  try {
    const { game, errorMessage } = await findGameAndUpdateOrFail(updatedGame);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    // Is we can to finish the game?
    const maxScore = Math.max(...game.scores.values());
    console.log(" roundFinish >> maxScore:::", maxScore);

    // Game END
    if (maxScore >= game.finishPoints) {
      console.log("gameEnd");
      game.gameStatus = FINISH;
      await game.save();

      // Очищення userActiveGameId для всіх гравців
      const playerIds = game.players.map(p => p._id);
      await User.updateMany(
        { _id: { $in: playerIds } },
        { userActiveGameId: null },
      );

      io.to(updatedGame._id).emit("gameEnd", { game });

      // Clear userActiveGameId for all players in room (maybe need use it after push some button "Finish" on the client, because it will clear active game from render)
      io.to(updatedGame._id).emit("UserActiveGameId_Updated", {
        userActiveGameId: null,
      });
    } else {
      io.to(updatedGame._id).emit(event, { game });
    }
  } catch (err) {
    console.error("Error in handling current game run:", err);
    socketEmitError({
      errorMessage: "Error in handling current game run.",
      socket,
    });
  }
};
