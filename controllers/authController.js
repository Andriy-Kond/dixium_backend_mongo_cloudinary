import { User } from "../models/userModel.js";
import { HttpError } from "../utils/HttpError.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config"; // must be imported in each place where you get any keys from process.env

import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";

const { SECRET_KEY = "" } = process.env;

//# Moved to "upload" middleware
// const tempDir = path.join(__dirname, "../", "temp");
// const multerConfig = {
//   destination: tempDir,
// };
// export const upload = multer({ storage: multerConfig });
//#/ Moved to "upload" middleware

const register = async (req, res, next) => {
  //# Adding custom error message for 409 status when you validate uniq field (for example "email")
  const { email, password } = req.body;
  const user = await User.findOne({ email }); // Find user with this email. If not found, returns "null"
  if (user) {
    throw HttpError({
      status: 409,
      message: `Email ${email} already in our db`,
    });
  }
  //#/ Adding custom error message for 409 status when you validate uniq field (for example "email")

  const hashedPassword = await bcrypt.hash(password, 10);
  const defaultAvatarURL = gravatar.url(email, {
    s: 200,
    protocol: true,
    d: "robohash", // або:
    //! mp,
    // identicon,
    // retro,
    //! robohash,
    //! wavatar
    // monsterid
    // blank
    // 404(Return error.Useful if you want to handle the absence of an avatar in your own way)
    // own picture: "default: 'https://example.com/my-default-avatar.png',"
  });

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL: defaultAvatarURL,
  });

  res.status(201).json({
    email: newUser.email,
    name: newUser.name,
  });
};

const login = async (req, res, next) => {
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
  const payload = { id: user._id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  // console.log("login >> token:::", token);
  await User.findByIdAndUpdate(user._id, { token });

  res.json({ token });
};

// Check whether token is still valid and send name&email
const getCurrentUser = (req, res, next) => {
  const { email, name } = req.user;
  res.json({ email, name });
};

// Check whether token is still valid and send name&email
const logout = async (req, res, next) => {
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

  console.log("changeAvatar >> req.file:::", req.file);
  // changeAvatar >> req.file::: {
  //   fieldname: 'avatarFile',
  //!  originalname: 'The Hammer and the Cross.jpg',
  //   encoding: '7bit',
  //   mimetype: 'image/jpeg',
  //   destination: 'D:\\Programming\\Node.js\\2024\\node-js-2024-hw\\m5-files-to-server\\temp',
  //!  filename: 'The_Hammer_and_the_Cross.jpg',
  //   path: 'D:\\Programming\\Node.js\\2024\\node-js-2024-hw\\m5-files-to-server\\temp\\The_Hammer_and_the_Cross.jpg',
  //   size: 41717
  // }

  const { path: tempDirWithFileName, filename } = req.file;
  const uniqFileName = `${_id}_${filename}`;
  const uploadDirWithFileName = path.join(uploadAvatarsDir, uniqFileName);
  await fs.rename(tempDirWithFileName, uploadDirWithFileName, errCb);

  // File name must have relative path, because file could be saved on some cloud instead PC, as in this example
  const avatarRelativePathWithFileName = path.join("avatars", uniqFileName); // Relative path on the server. The "public" word not needs because it showed in middleware "app.use(express.static

  await User.findByIdAndUpdate(_id, {
    avatarURL: avatarRelativePathWithFileName,
  });

  res.status(201).json({ avatarURL: avatarRelativePathWithFileName });
};

export const authController = {
  register: tryCatchDecorator(register),
  login: tryCatchDecorator(login),
  getCurrentUser: tryCatchDecorator(getCurrentUser), // can be without tryCatchDecorator
  logout: tryCatchDecorator(logout),
  changeAvatar: tryCatchDecorator(changeAvatar),
};
