import { Game } from "../../models/gameModel.js";

export const setFinishPoints = async ({ gameId, finishPoints, socket }) => {
  console.log("setFinishPoints");

  const event = "Set_Finish_Points_Success";

  try {
    const game = await Game.findById(gameId);
    if (!game)
      return socketEmitError({
        errorMessage: `Game with gameId ${gameId} not found`,
        socket,
      });

    game.finishPoints = finishPoints;
    await game.save();

    socket.emit(event, { gameId, finishPoints: game.finishPoints });
  } catch (err) {
    console.error("Error in handling game update:", err);
    socketEmitError({
      errorMessage: "Error in handling update cardsListUpdate",
      socket,
      event,
    });
  }
};
