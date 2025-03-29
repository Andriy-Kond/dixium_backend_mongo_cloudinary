import { getImagePath, getAllFolders } from "./getImagePath.js";
import { saveDeckToMongo } from "./saveDeckToMongo.js";
import { saveTitlesDeckToMongo } from "./saveTitlesDeckToMongo.js";

// Імпорт однієї колоди (залишаємо як є для гнучкості)
export async function imgPathImport(deckName) {
  const images = await getImagePath(`dixium/dixium_decks/${deckName}`);

  await saveDeckToMongo(deckName, images);
}

// Iмпорт всіх колод
export async function importAllDecks() {
  try {
    const folders = await getAllFolders("dixium/dixium_decks"); // Отримуємо всі теки з префіксом "dixium"
    console.log("Found folders:", folders);

    for (const folder of folders) {
      const deckName = folder.split("/").pop(); // Беремо лише назву теки - останній елемент в масиві, що розділений "/" (наприклад, "deck_01")
      console.log(`Importing deck: ${deckName}`);
      await imgPathImport(deckName); // Імпортуємо колоду
    }
    console.log("All decks imported successfully!");
  } catch (error) {
    console.error("Error importing decks:", error.message);
  }
}

// Імпорт титулів
export async function importTitlesDeck() {
  try {
    const images = await getImagePath(`dixium/dixium_title`);

    await saveTitlesDeckToMongo("dixium_title", images);

    console.log("dixium_title imported successfully!");
  } catch (error) {
    console.error("Error importing dixium_title:", error.message);
  }
}
