import { HttpError } from "../utils/HttpError.js";

export const checkErrorJoiSchemaDecorator_v1 = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) next(HttpError({ status: 400, message: error.message }));

    next();
  };
};

export const checkErrorJoiSchemaDecorator = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false }); // Показувати всі помилки валідації (наприклад, якщо email і password невірні, показати обидві помилки).

    if (error) {
      console.log("checkErrorJoiSchemaDecorator");
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(", ");

      next(HttpError({ status: 400, message: errorMessage }));
    }
    next();
  };
};
