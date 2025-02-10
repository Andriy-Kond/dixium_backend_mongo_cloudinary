import express from "express";
import { deckController } from "../../controllers/deskController.js";

export const deskRouter = express.Router();

deskRouter.get("/", deckController.getDecks);
deskRouter.get("/:deckId", deckController.getCurrentDeck);
