import "dotenv/config";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "../models/userModel.js";
import { HttpError } from "../utils/HttpError.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const { SECRET_KEY = "" } = process.env;

const register = async (req, res) => {
  //# Adding custom error message for 409 status when you validate uniq field (for example "email")
  const { email, password } = req.body;
  const user = await User.findOne({ email }); // Find user with this email. If not found, returns "null"
  if (user) {
    throw HttpError({
      status: 409,
      message: `Email ${email} already in our db`,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const defaultAvatarURL = gravatar.url(email, {
    s: 200,
    protocol: true,
    d: "robohash",
  });

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL: defaultAvatarURL,
  });

  newUser.token = jwt.sign({ id: newUser._id }, SECRET_KEY, {
    expiresIn: "23h",
  });

  await newUser.save();

  res.status(201).json(newUser);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError({
      status: 401,
      message: `Email or password invalid`,
    });
  }

  const comparePass = await bcrypt.compare(password, user.password);
  if (!comparePass) {
    throw HttpError({
      status: 401,
      message: `Email or password invalid`,
    });
  }

  // Create and send token
  const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({ ...user._doc, token });
};

// Check whether token is still valid and send name&email
const getCurrentUser = (req, res) => {
  const { email, name, avatarURL } = req.user;

  res.json({ email, name, avatarURL });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.json({ message: "Logout success" });
};

const changeAvatar = async (req, res) => {
  const errCb = err => {
    if (err) throw `err.message: ${err.message}`;
    console.log("Rename complete!");
  };

  const __dirname = import.meta.dirname; // here it is path to "controllers" folder
  const uploadAvatarsDir = path.join(__dirname, "../", "public", "avatars");

  const { _id } = req.user;
  const { path: tempDirWithFileName, filename } = req.file;
  const uniqFileName = `${_id}_${filename}`;
  const uploadDirWithFileName = path.join(uploadAvatarsDir, uniqFileName);
  await fs.rename(tempDirWithFileName, uploadDirWithFileName, errCb);

  // File name must have relative path, because file could be saved on some cloud instead PC, as in this example
  const avatarRelativePathWithFileName = path.join("avatars", uniqFileName); // Relative path on the server. The "public" word not needs because it showed in middleware app.use(express.static("public"));

  await User.findByIdAndUpdate(_id, {
    avatarURL: avatarRelativePathWithFileName,
  });

  res.status(201).json({ avatarURL: avatarRelativePathWithFileName });
};

export const authController = {
  register: tryCatchDecorator(register),
  login: tryCatchDecorator(login),
  getCurrentUser: tryCatchDecorator(getCurrentUser),
  logout: tryCatchDecorator(logout),
  changeAvatar: tryCatchDecorator(changeAvatar),
};
