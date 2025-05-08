import { Deck } from "../models/deckModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const getAllDecks = async (req, res) => {
  console.log("start getDecks");
  const decks = await Deck.find();

  res.json(decks);
};

const getCurrentDeck = async (req, res) => {
  console.log("start get current deck");
  // console.log("req.params :>> ", req.params);
  // console.log(" req.body :>> ", req.body);

  const deck = await Deck.findOne({ _id: req.params.deckId });
  // console.log("getDeck >> deck:::", deck);

  res.json(deck);
};

export const deckController = {
  getAllDecks: tryCatchDecorator(getAllDecks),
  getCurrentDeck: tryCatchDecorator(getCurrentDeck),
};
