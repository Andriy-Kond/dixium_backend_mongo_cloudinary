import { getImagePath } from "./getImagePath.js";
import { saveDeckToMongo } from "./saveDeckToMongo.js";

export async function imgPathImport(deckName) {
  const images = await getImagePath(`/dixium/${deckName}`);

  await saveDeckToMongo(deckName, images);
}
