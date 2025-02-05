const mongoose = require("mongoose");

const DeckSchema = new mongoose.Schema({
  name: String,
  cards: [{ name: String, url: String }],
});

const Deck = mongoose.model("Deck", DeckSchema);

async function saveDeckToMongo(deckName, images) {
  await mongoose.connect("mongodb://localhost:27017/dixit");

  const deck = new Deck({
    name: deckName,
    cards: images,
  });

  await deck.save();
  console.log(`Deck ${deckName} saved to MongoDB.`);
}

// Використання
getImagesFromFolder("deck_01").then(images => {
  saveDeckToMongo("deck_01", images);
});

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

// getImagesFromFolder('deck_03').then(images => {
//   saveDeckToMongo('deck_03', images);
// });

// ✅ Це оновить MongoDB автоматично.

// Метод .save() у Mongoose
// .save() використовується для збереження документа в базі після його створення через new Deck({...}).
// Він дозволяє виконувати додаткові перевірки або викликати middleware перед записом в базу.
// .create() створює та одразу записує новий документ у базу, а .save() дозволяє спочатку створити об'єкт у пам'яті, модифікувати його, а потім зберегти.

// Приклад:
const newDeckBySave = new Deck({ name: "My Deck" }); // Створили екземпляр
await newDeckBySave.save(); // Зберегли його в базу

// Якщо ж використати .create(), то це виглядатиме так:
const newDeckByCreate = await Deck.create({ name: "My Deck" }); // Одразу створює і зберігає
