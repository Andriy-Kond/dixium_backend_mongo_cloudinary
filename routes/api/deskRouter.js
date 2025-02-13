import express from "express";
import { deckController } from "../../controllers/deskController.js";

export const deskRouter = express.Router();

deskRouter.get("/", deckController.getAllDecks);
deskRouter.get("/:deckId", deckController.getCurrentDeck);
