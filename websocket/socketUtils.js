const userSocketMap = new Map(); // Мапа гравців - щоб прив'язати user._id до socket.id для того щоб надіслати повідомлення конкретному гравцю.

export const getUserSocketId = userId => userSocketMap.get(userId) || null;

// CONNECTION ==================
export const registerUserId = (userId, socket) => {
  console.log("registerUserId");
  for (const [existingUserId, socketId] of userSocketMap.entries()) {
    if (existingUserId === userId) {
      userSocketMap.delete(existingUserId);
      console.log(`Removed old socket mapping for user ${userId}`);
    }
  }
  userSocketMap.set(userId, socket.id);
  console.log(`Registered user ${userId} with socket ${socket.id}`);
};

// DISCONNECT ===============================
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
