import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { Game } from "./models/gameModel.js";
import { createNewGame } from "./services/gameService.js";

export const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Відстежуємо зміни в колекції
const changeStream = Game.watch();

changeStream.on("change", change => {
  console.log("Зміни в БД:", change);
  if (change.operationType === "delete") {
    io.emit("dbUpdate", change); // Надсилаємо подію клієнтам лише при видаленні
  }
});

io.on("connection", socket => {
  console.log(`User connected: ${socket.id}`);

  // Обробка створення нової гри (Гравець створює гру)
  socket.on("createGame", async gameData => {
    try {
      const newGame = await createNewGame(gameData);

      // Оповіщення всіх під'єднаних клієнтів про створену гру
      io.emit("newGameCreated", newGame); // Надсилаємо ВСІМ (.emit) оновлений список ігор
    } catch (err) {
      console.error("Error creating game:", err);
    }
  });

  // Обробка підключення гравця до гри (Гравець приєднується до гри)
  socket.on("joinGame", async ({ gameId, player }) => {
    try {
      const game = await Game.findById(gameId);

      if (
        game &&
        !game.isGameStarted &&
        !game.players.some(p => p.userId === player.userId)
      ) {
        game.players.push(player);
        await game.save();

        // Оповіщення всіх про нових гравців у грі
        io.to(gameId).emit("playerJoined", game.players); // Надсилаємо оновлення лише тим, хто є у грі з id gameId

        // io.emit("playerJoined", { gameId, player }); // Надсилаємо ВСІМ оновлення (не правильно, якщо є багато ігор)
      }
      // Додаткова перевірка, щоб надіслати повідомлення, якщо гравець двічі доєднується до гри (не обов'язково)
      if (game.players.some(p => p.userId === player.userId)) {
        socket.emit("error", { message: "Ви вже приєдналися до гри!" });
        return;
      }
    } catch (err) {
      console.error("Error joining game:", err);
    }
  });

  // Обробка початку гри (Ведучий починає гру)
  socket.on("startGame", async gameId => {
    try {
      const game = await Game.findById(gameId);
      if (game) {
        game.isGameStarted = true;
        await game.save();

        // Оповіщення всіх у кімнаті
        io.to(gameId).emit("gameStarted", game); // надсилає їм подію "gameStarted" з об'єктом game
      }
    } catch (err) {
      console.error("Error starting game:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Користувач відключився: ${socket.id}`);
  });
});

// io.on("connection", socket => {
//   console.log("New player connected");

//   socket.on("start-game", async () => {
//     const decks = await Deck.find();
//     const deck = decks.flatMap(deck => deck.cards);
//     io.emit("game-started", deck);
//   });

//   socket.on("chat-message", message => {
//     socket.broadcast.emit("chat-message", message);
//   });
// });

//& io.to(room).emit(); - Подія буде відправлена лише тим клієнтам, які знаходяться у певній кімнаті (room) з ідентифікатором gameId.
//& io.emit("gameStarted", game); - Подія буде відправлена ВСІМ підключеним клієнтам без винятку.
