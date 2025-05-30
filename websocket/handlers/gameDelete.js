import { Game } from "../../models/gameModel.js";
import { User } from "../../models/userModel.js";
import { FINISH } from "../../utils/generals/constants.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameDelete = async ({ gameId, userId, socket, io }) => {
  console.log("gameDelete");

  try {
    // const game = await Game.findByIdAndDelete(gameId);
    const game = await Game.findById(gameId);
    if (!game)
      return socketEmitError({
        errorMessage: `Game with gameId ${gameId} not found`,
        socket,
      });

    const playerIds = game.players.map(p => p._id);
    playerIds.push(userId);

    await User.updateMany(
      { _id: { $in: playerIds } },
      { userActiveGameId: null },
    );

    // Clear userActiveGameId for all in room
    io.to(gameId).emit("UserActiveGameId_Updated", { userActiveGameId: null });

    game.gameStatus = FINISH;
    await game.save();
    // delete game for all (if they found it right now for example)
    io.emit("Game_Deleted", { game }); // send update to all users

    // io.to(updatedGame._id).emit("userDeletedFromGame", { game, deletedUser });
  } catch (err) {
    console.log("Server error: Cannot delete game", err);
    socketEmitError({
      errorMessage: "Server error: Cannot delete game",
      socket,
    });
  }
};
