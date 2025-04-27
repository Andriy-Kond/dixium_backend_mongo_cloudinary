import express from "express";
import { gameController } from "../../controllers/gameController.js";

export const gameRouter = express.Router();

gameRouter.get("/:id", gameController.getCurrentGame);
gameRouter.get("/find/:playerGameId", gameController.findGame);
gameRouter.delete("/:id", gameController.removeGame);
// gameRouter.get("/", gameController.getAllGames);
// gameRouter.post("/", gameController.createGame);
// gameRouter.patch("/:id", gameController.updateGame);
