import { Title } from "../../models/titleModel.js";

export async function saveTitlesDeckToMongo(titlesDeckName, images) {
  const isExistTitlesDeck = await Title.findOne({ name: titlesDeckName });

  if (isExistTitlesDeck)
    return console.log(`Title deck with name ${titlesDeckName} already exist.`);

  await Title.create({
    name: titlesDeckName,
    cards: images,
  });

  console.log(`Title deck ${titlesDeckName} saved to MongoDB.`);
}
