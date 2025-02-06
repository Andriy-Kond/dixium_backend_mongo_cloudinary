import mongoose from "mongoose";
import { HttpError } from "../utils/HttpError.js";

const DeckSchema = new mongoose.Schema({
  name: String,
  cards: [{ public_id: String, url: String }],
});

const Deck = mongoose.model("Deck", DeckSchema);

export async function saveDeckToMongo(deckName, images) {
  const isExistDeck = await Deck.findOne({ name: deckName });

  console.log("saveDeckToMongo >> isExistDeck:::", isExistDeck);
  if (isExistDeck) {
    throw HttpError({
      status: 401,
      message: `Deck with name ${deckName} already exist.`,
    });
  }

  const deck = new Deck({
    name: deckName,
    cards: images,
  });

  await deck.save();
  console.log(`Deck ${deckName} saved to MongoDB.`);
}

// Використання
// getImagesFromCloudinaryFolder("deck_01").then(images => {
//   saveDeckToMongo("deck_01", images);
// });

// Тепер у MongoDB буде структура:
// {
//   "name": "deck_01",
//   "cards": [
//     { "name": "image_1", "url": "https://res.cloudinary.com/..." },
//     { "name": "image_2", "url": "https://res.cloudinary.com/..." }
//   ]
// }

// Як додавати нові колекції (колоди карт) у базу даних?
// 📌 Щоразу, коли ти додаєш нову теку (deck_03), просто виконай:
// getImagesFromCloudinaryFolder('deck_03').then(images => {
//   saveDeckToMongo('deck_03', images);
// });
// ✅ Це оновить MongoDB автоматично.

// Метод .save() у Mongoose
// .save() використовується для збереження документа в базі після його створення через new Deck({...}).
// Він дозволяє виконувати додаткові перевірки або викликати middleware перед записом в базу.
// .create() створює та одразу записує новий документ у базу, а .save() дозволяє спочатку створити об'єкт у пам'яті, модифікувати його, а потім зберегти.

// Приклад:
// const newDeckBySave = new Deck({ name: "My Deck" }); // Створили екземпляр
// await newDeckBySave.save(); // Зберегли його в базу

// Якщо ж використати .create(), то це виглядатиме так:
// const newDeckByCreate = await Deck.create({ name: "My Deck" }); // Одразу створює і зберігає
