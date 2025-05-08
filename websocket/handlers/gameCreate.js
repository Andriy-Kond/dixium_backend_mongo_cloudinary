import { User } from "../../models/userModel.js";
import { createNewGame } from "../../services/gameServices.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameCreate = async ({ gameData, socket, io }) => {
  console.log("gameCreate");

  try {
    // Створити нову гру.
    const { game, errorMessage } = await createNewGame(gameData);
    if (errorMessage) return socketEmitError({ errorMessage, socket });
    console.log(" gameCreate >> game:::", game.gameName);

    const user = await User.findById(gameData.hostPlayerId);
    if (!user)
      return socketEmitError({
        errorMessage: `Error: user with gameId ${game._id} not found`,
        socket,
      });

    user.userActiveGameId = game._id;
    await user.save();

    game.isGameStarted = true;
    game.players.push(user);
    await game.save();

    socket.emit("UserActiveGameId_Updated", {
      userActiveGameId: user.userActiveGameId,
    });

    //* Приєдную сокет поточного плеєра до кімнати
    const roomId = game._id.toString();
    // console.log(`Joining room with gameId: ${roomId}`);
    socket.join(roomId);
    // console.log(`Socket ${socket.id} rooms:`, socket.rooms);
    // console.log(
    //   `Sockets in room ${roomId}:`,
    //   io.sockets.adapter.rooms.get(roomId)?.size || 0,
    // );

    //* Notify room
    // console.log(`Room sockets:`, io.sockets.adapter.rooms.get(roomId));

    // console.log(" io.to >> game._id:::", game._id);
    io.to(game._id).emit("playerJoined", {
      game,
      player: user,
      message: `Player ${user.name.toUpperCase()} joined to game`,
    });

    socket.emit("game_Created", { game }); // send new game to user who created this game

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
  } catch (err) {
    console.log(" gameCreate >> err:::", err);
    console.error("Error creating game:", err);
    socketEmitError({
      errorMessage: `Error creating game: ${err.message}`,
      socket,
    });
  }
};
