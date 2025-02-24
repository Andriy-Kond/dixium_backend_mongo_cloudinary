import { Deck } from "../../models/deckModel.js";

export async function saveDeckToMongo(deckName, images) {
  const isExistDeck = await Deck.findOne({ name: deckName });

  if (isExistDeck)
    return console.log(`Deck with name ${deckName} already exist.`);

  await Deck.create({
    name: deckName,
    cards: images,
  });

  console.log(`Deck ${deckName} saved to MongoDB.`);
}
