import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import cloudinary from "./admin/cloudinaryToMongoImagesPaths/cloudinaryConfig.js";
import { Game } from "./models/gameModel.js";

const { DB_HOST, PORT: port = 3000, SECRET_KEY } = process.env;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(error => {
    console.log(error.message);
    process.exit(1);
  });

// Генерація JWT токена
const generateToken = userId =>
  jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: "23h" });

// Авторизація через JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Ендпоінт реєстрації гравця
app.post("/register", async (req, res) => {
  const { username } = req.body;
  const newGame = new Game({ players: [username], cards: [] });
  await newGame.save();
  const token = generateToken(newGame._id);
  res.json({ token });
});

// Завантаження картки у Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  "/upload-card",
  authMiddleware,
  upload.single("card"),
  async (req, res) => {
    const result = await cloudinary.uploader.upload_stream(
      { folder: "dixit" },
      async (error, cloudResult) => {
        if (error) return res.status(500).json({ message: "Upload failed" });

        const game = await Game.findById(req.user.id);
        game.cards.push({ owner: req.user.id, url: cloudResult.secure_url });
        await game.save();

        res.json({ url: cloudResult.secure_url });
      },
    );

    result.end(req.file.buffer);
  },
);

// WebSocket логіка
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

httpServer.listen(port, () => console.log(`Server running on port ${port}`));
