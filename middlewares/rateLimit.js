import rateLimit from "express-rate-limit";
import { HttpError } from "../utils/HttpError.js";

//^ Middleware для обмеження запитів для ендпоінтів авторизації
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Часовий проміжок (15 хвилин) для відстеження запитів
  max: 100, // Максимальна кількість запитів (10/100/1000) на IP у проміжку windowMs
  message: async (req, res) => {
    // Кастомна відповідь із помилкою, використовуючи HttpError.
    throw HttpError({
      status: 429,
      message: "Too many requests. Try again later.",
    });
  },
  standardHeaders: true, // Повертає інформацію про обмеження у заголовках `RateLimit-*`. Додає заголовки RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, які фронтенд може використати для інформування користувачів.
  legacyHeaders: false, // Вимикає застарілі заголовки `X-RateLimit-*`
});
