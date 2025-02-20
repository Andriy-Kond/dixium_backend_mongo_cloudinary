// This fn receives the controller-function (ctrlFn) as argument, creates the cover-fn (coverFn) and inside the "try-catch" invokes the controller-function
export const tryCatchDecorator = ctrlFn => {
  const coverFn = async (req, res, next) => {
    try {
      await ctrlFn(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  return coverFn;
};

export const tryCatchDecoratorForWebsocket = handler => {
  return async (...args) => {
    const [socket] = args;

    try {
      await handler(...args);
    } catch (error) {
      console.error("Socket error:", error);
      socket.emit("error", { message: "Server error" });
    }
  };
};
