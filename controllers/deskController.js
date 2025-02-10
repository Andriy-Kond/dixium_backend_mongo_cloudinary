import { Deck } from "../models/deckModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const getDecks = async (req, res) => {
  // console.log("start getDecks");
  const decks = await Deck.find();
  // console.log("getDecks >> decks:::", decks);

  res.json(decks);
};

const getCurrentDeck = async (req, res) => {
  console.log("start get current deck");
  console.log("req.params :>> ", req.params);
  console.log(" req.body :>> ", req.body);

  const deck = await Deck.findOne({ _id: req.params.deckId });
  console.log("getDeck >> deck:::", deck);

  res.json(deck);
};

export const deckController = {
  getDecks: tryCatchDecorator(getDecks),
  getCurrentDeck: tryCatchDecorator(getCurrentDeck),
};
