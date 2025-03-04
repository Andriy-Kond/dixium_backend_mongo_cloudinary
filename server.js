import "dotenv/config";
import mongoose from "mongoose";
import { httpServer } from "./websocket/server_socket_io.js";
import { importAllDecks } from "./admin/imgPathImport/imgPathImport.js";

// import { imgPathImport } from "./admin/imgPathImport/imgPathImport.js";

const { DB_HOST, PORT: port = 3000 } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log("MongoDB connected");
    //! Admin Decks Import desks:
    // importAllDecks();
  })
  .catch(err => {
    console.log(err.message);
    process.exit(1);
  });

httpServer.listen(port, () => console.log(`Server running on port ${port}`));
