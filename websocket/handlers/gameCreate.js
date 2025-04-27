import { User } from "../../models/userModel.js";
import { createNewGame } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameCreate = async ({ gameData, socket, io }) => {
  console.log("gameCreate");

  try {
    // Створити нову гру.
    const { game, errorMessage } = await createNewGame(gameData);
    if (errorMessage) return socketEmitError({ errorMessage, socket });

    const user = await User.findById(gameData.hostPlayerId);
    if (!user)
      return socketEmitError({
        errorMessage: `Error: user with gameId ${game._id} not found`,
        socket,
      });

    user.userActiveGameId = game._id;
    await user.save();
    console.log(
      " gameCreate >> user.userActiveGameId:::",
      user.userActiveGameId,
    );

    socket.emit("gameCreated", { game }); // send new game to user who created this game
    socket.emit("UserActiveGameId:Update", {
      userActiveGameId: user.userActiveGameId,
    });
    // console.log(" gameCreate >> user:::", user);
    // gameCreate >> user::: {
    //   _id: new ObjectId('67fe6ea01bd21e525b20cd38'),
    //   name: 'Andy',
    //   email: 'akwebua.study@gmail.com',
    //   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmU2ZWEwMWJkMjFlNTI1YjIwY2QzOCIsImlhdCI6MTc0NTQxMzQ1MSwiZXhwIjoxNzQ1NDk2MjUxfQ.oHe_R8xJCHhnAnQc1XESixim6Rco2KIv9oSvqiwwUEE',
    //   avatarURL: 'https://lh3.googleusercontent.com/a/ACg8ocIACoD4tEdhI_Qz577wYK2mCchqK5aa31q-kLGbdRhIEFanm3E=s96-c',
    //   googleId: '113888083265055069149',
    //   playerGameId: 2680,
    //   createdAt: 2025-04-15T14:35:12.958Z,
    //   updatedAt: 2025-04-23T16:34:48.545Z,
    //   userActiveGameId: '680916a8acf3def6be2d6fb6'
    // }

    console.log(" gameCreate:::", game.gameName);
  } catch (err) {
    console.log(" gameCreate >> err:::", err);
    console.error("Error creating game:", err);
    socketEmitError({
      errorMessage: `Error creating game: ${err.message}`,
      socket,
    });
  }
};
