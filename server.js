import "dotenv/config";
import mongoose from "mongoose";
import { httpServer } from "./server_socket_io.js";

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

httpServer.listen(port, () => console.log(`Server running on ${port}`));
