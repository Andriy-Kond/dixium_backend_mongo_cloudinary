//* Server MongoDB + Socket.io

// import { contactsRouter } from "./routes/api/contactsRouter.js";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/api/authRouter.js";
import { deskRouter } from "./routes/api/deskRouter.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// app.use("/api/contacts", contactsRouter);
app.use("/api/auth", authRouter);
app.use("/dixium/decks", deskRouter);

app.use("/", (req, res, next) => {
  res.status(404).json({ message: "Not found route" });
});

// Route for errors (4 parameters)
app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  return res.status(status).json({ message });
});

//^ app.use([path], middleware);
// .use((req, res, next) => {...}): add middleware for each request (PUT, DELETE, etc.)
// .use('/api', (req, res, next) => {...}): add middleware for requests on routes starting with '/api' (/api/users, /api/products/123, etc)
// .use((err, req, res, next) => {...}): add middleware for errors processing
