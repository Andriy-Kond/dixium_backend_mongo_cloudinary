import express from "express";
import { gameController } from "../../controllers/gameController.js";

export const gameRouter = express.Router();

gameRouter.post("/", gameController.createGame);
