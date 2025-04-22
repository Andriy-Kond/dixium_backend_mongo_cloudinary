import express from "express";
import { gameController } from "../../controllers/gameController.js";

export const gameRouter = express.Router();

// gameRouter.get("/", gameController.getAllGames);
gameRouter.get("/:id", gameController.getCurrentGame);
gameRouter.get("/find/:playerGameId", gameController.findGame);
// gameRouter.post("/", gameController.createGame);
gameRouter.delete("/:id", gameController.removeGame);
gameRouter.patch("/:id", gameController.updateGame);
