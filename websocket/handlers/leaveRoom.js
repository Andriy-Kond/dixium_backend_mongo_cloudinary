export const leaveRoom = async ({ room, socket, io }) => {
  console.log("leaveRoom");

  // Перевірка учасників кімнати
  console.log(" leaveRoom >> room:::", room);
  const currentRoom = io.sockets.adapter.rooms.get(room);
  console.log(" leaveRoom >> currentRoom:::", currentRoom);

  if (currentRoom) {
    console.log("Користувачі в кімнаті:", currentRoom.size);
  } else {
    console.log("Кімната порожня або не існує");
  }

  socket.leave(room);
  if (currentRoom) {
    console.log("Користувачі в кімнаті:", currentRoom.size);
  } else {
    console.log("Кімната порожня або не існує");
  }
};
