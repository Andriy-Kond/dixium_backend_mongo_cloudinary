// send to current user:
export const socketEmitError = ({ message, event = "error", socket }) =>
  socket.emit(event, { message });
