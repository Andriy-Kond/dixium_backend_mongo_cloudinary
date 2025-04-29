// Для використання в різних частинах коду
// Передача userSocketMap у всі обробники:
// Якщо ви плануєте використовувати userSocketMap в інших обробниках (наприклад, gameCreate, startOrJoinToGame), вам доведеться передавати її в кожен із них. Щоб уникнути цього, можна зробити userSocketMap доступною через контекст або модуль.

const userSocketMap = new Map(); // Мапа гравців - щоб прив'язати user._id -> socket.id

// CONNECTION ==================
// Для роботи з одного пристрою:
export const registerUserId = (userId, socket) => {
  console.log("registerUserId");
  // Клієнт надсилає свій user._id при підключенні
  userSocketMap.set(userId, socket.id);
  console.log(`Registered user ${userId} with socket ${socket.id}`);
};

// // Якщо клієнт відкриє додаток на кількох пристроях одночасно в нього буде однаковий ID, але у Map() залишиться останній.
// // Тому можна створити масив сокетів для одного ID для роботи з кількох пристроїв:
// export const registerUserIdForManyDevices = (userId, socket) => {
//   console.log("registerUserIdForManyDevices");
//   if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());

//   userSocketMap.get(userId).add(socket.id);
//   console.log(`Registered user ${userId} with socket ${socket.id}`);
// };

// DISCONNECT ===============================
// Для роботи лише з одного пристрою:
export const userDisconnect = socket => {
  // Видалення користувача з мапи при відключенні
  for (const [userId, socketId] of userSocketMap.entries()) {
    if (socketId === socket.id) {
      userSocketMap.delete(userId);
      console.log(`User ${userId} disconnected`);
      break;
    }
  }
};

// // Якщо клієнт відкриє додаток на кількох пристроях одночасно в нього буде однаковий ID, але у Map() залишиться останній.
// // Тому можна створити масив сокетів для одного ID для роботи з кількох пристроїв:
// export const userDisconnectForManyDevices = socket => {
//   for (const [userId, socketIds] of userSocketMap.entries()) {
//     if (socketIds.has(socket.id)) {
//       socketIds.delete(socket.id);
//       if (socketIds.size === 0) {
//         userSocketMap.delete(userId);
//       }
//       console.log(`User ${userId} disconnected, socket ${socket.id}`);
//       break;
//     }
//   }
// };

// DELETE USER ==================================
// Для роботи з одного пристрою
export function emitUserActiveGameIdUpdate(deletedUserId, io) {
  const socketId = userSocketMap.get(deletedUserId);

  if (socketId)
    io.to(socketId).emit("UserActiveGameId:Update", {
      userActiveGameId: null,
    });
  else console.log(`Socket for user ${deletedUserId} not found`);
}

// // Для роботи з кількох пристроїв
// // Відправити UserActiveGameId:Update користувачу на всі його пристрої, якщо це було передбачено при створені Map()
// export function emitUserActiveGameForManyDevices(deletedUserId, io) {
//   const socketIds = userSocketMap.get(deletedUserId);
//   if (socketIds) {
//     socketIds.forEach(socketId => {
//       io.to(socketId).emit("UserActiveGameId:Update", {
//         userActiveGameId: null,
//       });
//     });
//   } else {
//     console.log(`Socket for user ${deletedUserId} not found`);
//   }
// }

export const getUserSocketIds = userId => userSocketMap.get(userId) || null;

// export const getUserSocketIdsForManyDevices = userId =>
//   userSocketMap.get(userId) || new Set();
