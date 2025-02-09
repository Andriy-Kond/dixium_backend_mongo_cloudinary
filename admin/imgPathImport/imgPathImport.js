import { getImagePath } from "./getImagePath.js";
import { saveDeckToMongo } from "./saveDeckToMongo.js";

export async function imgPathImport(deckName) {
  const images = await getImagePath(`dixium/${deckName}`);
  console.log("imgPathImport >> images:::", images);
  await saveDeckToMongo(deckName, images);
}
