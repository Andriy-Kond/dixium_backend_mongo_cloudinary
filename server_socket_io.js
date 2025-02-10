import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { Deck } from "./models/deckModel.js ";

export const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", socket => {
  console.log("New player connected");

  socket.on("start-game", async () => {
    const decks = await Deck.find();
    const deck = decks.flatMap(deck => deck.cards);
    io.emit("game-started", deck);
  });

  socket.on("chat-message", message => {
    socket.broadcast.emit("chat-message", message);
  });
});
