import "dotenv/config";
import mongoose from "mongoose";
import { httpServer } from "./server_socket_io.js";

// import { saveDeckToMongo } from "./imagesImport/saveDeckToMongo.js";
import { imgPathImport } from "./imagesImport/imgPathImport.js";

const { DB_HOST, PORT: port = 3000 } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(err => {
    console.log(err.message);
    process.exit(1);
  });

//! Admin Decks Imports
const deckName = "deck_02";
// imgPathImport(deckName);
// const images = await getImagePath(`dixium/${deckName}`);
// await saveDeckToMongo(deckName, images);

httpServer.listen(port, () => console.log(`Server running on port ${port}`));
