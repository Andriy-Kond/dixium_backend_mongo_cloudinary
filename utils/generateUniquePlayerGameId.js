// Генерує випадковий номер у діапазоні 0020–9999 (0000-0019 - резерв для адмінів).
// Перевіряє, чи номер уже зайнятий у базі даних.
// Якщо зайнятий, генерує новий, доки не знайде унікальний.

import { User } from "../models/userModel.js";

export const generateUniquePlayerGameId = async () => {
  const minId = 20; // 0020
  const maxId = 9999;

  let isUnique = false;
  let playerGameId;

  while (!isUnique) {
    playerGameId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
    const existingUser = await User.findOne({ playerGameId });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return playerGameId;
};
