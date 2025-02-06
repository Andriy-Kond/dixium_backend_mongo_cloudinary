import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { Game } from "./models/gameModel.js";

export const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  console.log("New player connected");

  socket.on("start-game", async () => {
    const games = await Game.find();
    const deck = games.flatMap(game => game.cards);
    io.emit("game-started", deck);
  });

  socket.on("chat-message", message => {
    socket.broadcast.emit("chat-message", message);
  });
});
