import { getImagePath, getAllFolders } from "./getImagePath.js";
import { saveDeckToMongo } from "./saveDeckToMongo.js";

// Імпорт однієї колоди (залишаємо як є для гнучкості)
export async function imgPathImport(deckName) {
  const images = await getImagePath(`dixium/${deckName}`);

  await saveDeckToMongo(deckName, images);
}

// Iмпорт всіх колод
export async function importAllDecks() {
  try {
    const folders = await getAllFolders("dixium"); // Отримуємо всі теки з префіксом "dixium"
    console.log("Found folders:", folders);

    for (const folder of folders) {
      const deckName = folder.split("/").pop(); // Беремо лише назву теки (наприклад, "deck_01")
      console.log(`Importing deck: ${deckName}`);
      await imgPathImport(deckName); // Імпортуємо колоду
    }
    console.log("All decks imported successfully!");
  } catch (error) {
    console.error("Error importing decks:", error.message);
  }
}
