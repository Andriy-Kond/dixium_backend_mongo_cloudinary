import { Game } from "../../models/gameModel.js";
import { User } from "../../models/userModel.js";
import {
  GUESSING,
  LOBBY,
  ROUND_RESULTS,
  VOTING,
} from "../../utils/generals/constants.js";

import { socketEmitError } from "../socketEmitError.js";

export const gameFindActive = async ({
  searchGameNumber,
  initUserId,
  socket,
  io,
}) => {
  console.log("gameFindActive");
  try {
    // Пошук незавершеної гри
    const game = await Game.findOne({
      playerGameId: Number(searchGameNumber),
      gameStatus: { $in: [LOBBY, GUESSING, VOTING, ROUND_RESULTS] }, // Шукаю лише активні ігри
    });

    if (!game) {
      return socketEmitError({
        errorMessage: `A game with number ${searchGameNumber} not found or already finished`,
        socket,
      });

      // throw HttpError({
      //   status: 404,
      //   message: `Game with number ${searchGameNumber} not found or already finished`,
      // });
    }

    // // update field userActiveGameId
    // const user = await User.findById(initUserId);
    // if (!user) {
    //   return socketEmitError({
    //     errorMessage: `User with id ${initUserId} not found`,
    //     socket,
    //   });
    // }
    // user.userActiveGameId = game._id;
    // await user.save();

    socket.emit("gameFound", { game }); // update game for user who sent this request

    // socket.emit("updateUserCredentials", { user }); // update user credentials
    // socket.emit("UserActiveGameId:Update", {
    //   userActiveGameId: user.userActiveGameId,
    // });
  } catch (err) {
    console.error("Error finding game:", err);
    socketEmitError({
      errorMessage: `Game with number ${searchGameNumber} not found.`,
      socket,
    });
  }
};
