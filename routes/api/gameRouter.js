import express from "express";
import { gameController } from "../../controllers/gameController.js";

export const gameRouter = express.Router();

gameRouter.get("/", gameController.getAllGames);
// gameRouter.post("/", gameController.createGame);
