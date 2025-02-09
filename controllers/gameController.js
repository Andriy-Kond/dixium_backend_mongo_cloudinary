import { Game } from "../models/gameModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const getDesks = async (req, res, next) => {
  // const desks = await Game.find({}, "-createdAt -updatedAt");
  console.log("start getDesks");
  const desks = await Game.find();
  console.log("getDesks >> desks:::", desks);

  res.json(desks);
};

export const gameController = {
  getDesks: tryCatchDecorator(getDesks),
};
