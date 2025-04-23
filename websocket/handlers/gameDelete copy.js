import mongoose from "mongoose";

import { Game } from "../../models/gameModel.js";
import { User } from "../../models/userModel.js";
import { socketEmitError } from "../socketEmitError.js";

export const gameDelete = async ({ gameId, userId, socket, io }) => {
  console.log("gameDelete");

  // Транзакції в MongoDB дозволяють виконувати кілька операцій (наприклад, оновлення документів у різних колекціях) атомарно, тобто або всі операції завершуються успішно, або жодна з них не застосовується.
  // Операції в межах транзакції: Усі запити до бази даних (наприклад, find, save, updateMany) виконуються з прив'язкою до сесії через параметр { session } або метод .session(session).
  // Підтвердження або скасування:
  //   Якщо всі операції успішні, викликається session.commitTransaction(), щоб зберегти зміни.
  //   Якщо виникає помилка, викликається session.abortTransaction(), щоб скасувати всі зміни.
  // Завершення сесії: Виклик session.endSession() звільняє ресурси.
  const session = await mongoose.startSession(); // створюється сесія для прив'язування транзакцій
  session.startTransaction(); // починає транзакцію, яка прив'язується до створеної сесії

  try {
    // Операції в межах транзакції
    const game = await Game.findByIdAndDelete(gameId).session(session);
    if (!game)
      return socketEmitError({
        errorMessage: `Game with gameId ${gameId} not found`,
        socket,
      });

    const playerIds = game.players.map(p => p._id);

    // updateMany - метод MongoDB (і Mongoose), який дозволяє оновити кілька документів у колекції, що відповідають певному критерію.
    // await Model.updateMany(filter, update, options);
    await User.updateMany(
      { _id: { $in: playerIds } }, // filter - вибирає всіх користувачів, чиї _id є в масиві playerIds.
      { userActiveGameId: "" },
      { session },
    );

    await session.commitTransaction();

    // delete game for all (if they found it right now for example)
    io.emit("gameDeleted", { game }); // send update to all users

    // Clear userActiveGameId for all in room
    // io.to(gameId).emit("updateUserCredentials", { user });
    io.to(gameId).emit("updateUserCredentials", {
      user: { userActiveGameId: "" },
    });

    // io.to(updatedGame._id).emit("userDeletedFromGame", { game, deletedUser });
  } catch (err) {
    await session.abortTransaction();

    console.log("Server error: Cannot delete game", err);
    socketEmitError({
      errorMessage: "Server error: Cannot delete game",
      socket,
    });
  } finally {
    session.endSession();
  }
};
