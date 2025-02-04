// const messageOfErrorStatus = status => {
//   switch (status) {
//     case 401:
//       return "Unauthorized";

//     default:
//       break;
//   }
// };

// export const HttpError = ({ status = 500, message = "Server error" }) => {
//   const error = new Error(message);
//   error.status = status;
//   // error.message = messageOfErrorStatus(status);

//   return error;
// };

const errorMessageList = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  400: "Not Found",
  409: "Conflict",
  500: "Server error",
};

export const HttpError = ({ status = 500, message }) => {
  const error = new Error(message);

  error.status = status;
  error.message = message ? message : errorMessageList[status];

  return error;
};
