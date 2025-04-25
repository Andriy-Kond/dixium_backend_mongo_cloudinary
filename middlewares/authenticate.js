import jwt from "jsonwebtoken";
import "dotenv/config";
import { HttpError } from "../utils/HttpError.js";
import { User } from "../models/userModel.js";

const { SECRET_KEY } = process.env;

//^ перевіряє JWT-токени у заголовку Authorization і додає автентифікованого користувача до req
export const authenticate = async (req, res, next) => {
  console.log("start authenticate :>> ");

  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer" || !token) {
    next(
      HttpError({
        status: 401,
        message: "Unauthorized - invalid or missing Bearer token (no 'Bearer')",
      }),
    );
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    // console.log("authenticate >> payload:::", payload);
    // // payload::: { id: '67765f1b21b8debb7ed21cb6', iat: 1735834786, exp: 1735917586 }

    const user = await User.findById(payload.id);

    // Чи існує користувач || чи є в нього токен || чи токен ще дійсний
    if (!user)
      next(
        HttpError({ status: 401, message: "Unauthorized. User not found." }),
      );

    if (!user.token || user.token !== token)
      next(
        HttpError({
          status: 401,
          message: "Unauthorized. Token invalid or revoked.",
        }),
      );

    if (!user.isEmailVerified && user.emailVerificationDeadline < new Date()) {
      // Блокує доступ до всіх захищених ендпоінтів (наприклад, /game, /set-password).
      next(
        HttpError({
          status: 403,
          message: "Email not verified. Please verify your email.",
        }),
      );
    }

    // Object "req" is one for one request. For example for request contactsRouter.post("/", authenticate, checkErrorJoiSchemaDecorator(joiContactSchemas.addContact), contactsController.addContact) it will be the same in authenticate, checkErrorJoiSchemaDecorator and contactsController.
    req.user = user; // For adding identification of this user in contactController.addContact() or other places
    next();
  } catch (err) {
    next(
      HttpError({
        status: 401,
        message: `Unauthorized. Invalid token: ${err.message} `,
      }),
    );
  }
};

// Якщо використовувати cookies:
export const authenticateWithCookies = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    next(HttpError({ status: 401, message: "Unauthorized - токен відсутній" }));
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(payload.id);

    if (!user) {
      next(
        HttpError({
          status: 401,
          message: "Unauthorized - користувача не знайдено",
        }),
      );
    }
    if (!user.token || user.token !== token) {
      next(
        HttpError({
          status: 401,
          message: "Unauthorized - токен недійсний або скасований",
        }),
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(
      HttpError({
        status: 401,
        message: `Unauthorized - недійсний токен: ${err.message}`,
      }),
    );
  }
};
