import express from "express";
import logger from "morgan"; // outputs to console request info
import cors from "cors";
import { contactsRouter } from "./routes/api/contactsRouter.js";
import { authRouter } from "./routes/api/authRouter.js";

//% Time to time access to process.env not in all project. Maybe moving these rows from server.js to app.js may help (but it is not certain):
// // require("dotenv").config();
// import "dotenv/config"; // Method .config() looks for file .env, reads it and add to process.env keys with values.

export const app = express();

// In package.json, depends of value (development or production) in variable ENV (aka NODE_ENV) will be showed full or short info
// cross-env NODE_ENV=production nodemon server.js - will show full info
const formatsLogger = app.get("env") === "development" ? "dev" : "short"; // read ENV and show full or short info

//^ app.use([path], middleware);
// .use((req, res, next) => {...}): add middleware for each request (PUT, DELETE, etc.)
// .use('/api', (req, res, next) => {...}): add middleware for requests on routes starting with '/api' (/api/users, /api/products/123, etc)
// .use((err, req, res, next) => {...}): add middleware for errors processing

app.use(logger(formatsLogger)); // show full or short info in log

app.use(cors());

app.use(express.json()); // Checks if exist body in each request. If exist, it checks type by header "Content-Type". If Content-Type === "application/json, this middleware convert it from string to object (by JSON.parse())

app.use(express.static("public")); // Allows GET requests to files from the "public" folder

app.use("/api/contacts", contactsRouter); // use contactsRouter methods if request on "/api/contacts" route

app.use("/api/auth", authRouter);

app.use("/", (req, res, next) => {
  res.status(404).json({ message: "Not found route" });
});

// Route for errors (4 parameters)
app.use((err, req, res, next) => {
  //$ opt1
  // res.status(500).json({ message: err.message });

  //$ opt2
  const { status = 500, message = "Server error" } = err;
  return res.status(status).json({ message });
});
