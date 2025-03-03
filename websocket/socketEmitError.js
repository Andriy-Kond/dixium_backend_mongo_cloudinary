// send to current user:
export const socketEmitError = ({
  errorMessage = "Server error: Game not found",
  event = "error",
  socket,
}) => socket.emit(event, { errorMessage });
