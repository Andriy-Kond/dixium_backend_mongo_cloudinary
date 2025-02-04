import { isValidObjectId } from "mongoose";
import { HttpError } from "../utils/HttpError.js";

export const isValidId = (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    next(HttpError({ status: 400, message: `${id} is not valid id` }));
  }

  next();
};
