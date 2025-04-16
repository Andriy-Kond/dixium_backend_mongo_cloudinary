import "dotenv/config";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "../models/userModel.js";
import { HttpError } from "../utils/HttpError.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";
import { OAuth2Client } from "google-auth-library";
import { generateUniquePlayerGameId } from "../utils/generateUniquePlayerGameId.js";

const { SECRET_KEY = "", GOOGLE_CLIENT_ID = "" } = process.env;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  console.log("register >>>");
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

  // Унікальний номер
  const playerGameId = await generateUniquePlayerGameId();

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL: defaultAvatarURL,
    playerGameId,
  });

  newUser.token = jwt.sign({ id: newUser._id }, SECRET_KEY, {
    expiresIn: "23h",
  });

  await newUser.save();

  res.status(201).json(newUser);
};

const login = async (req, res) => {
  console.log("login");
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError({
      status: 401,
      message: `Email or password invalid`,
    });
  }

  const comparePass = bcrypt.compare(password, user.password);
  if (!comparePass) {
    throw HttpError({
      status: 401,
      message: `Email or password invalid`,
    });
  }

  // Create and send token
  const jwtToken = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token: jwtToken });
  // user.token = jwtToken;
  // await user.save();
  res.json({ ...user._doc, token: jwtToken });
};

const googleLogin = async (req, res) => {
  console.log("googleLogin");
  // Перевіряє Google-токен.
  // Шукає користувача за googleId або email.
  // Якщо користувач із таким email уже є (наприклад, через email-авторизацію), пов'язує googleId.
  // Якщо користувача немає, створює нового з даними від Google.
  // Генерує JWT-токен, як і для email-авторизації.
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    // console.log(" googleLogin >> payload:::", payload);
    //  googleLogin >> payload::: {
    //   iss: 'https://accounts.google.com',
    //   azp: '398199371863-sp740c3kan5vij6v1qr98a03e1ouc2qt.apps.googleusercontent.com',
    //   aud: '398199371863-sp740c3kan5vij6v1qr98a03e1ouc2qt.apps.googleusercontent.com',
    //   sub: '105744500484448866696',
    //   email: '5thssswebua@gmail.com',
    //   email_verified: true,
    //   nbf: 1744620638,
    //   name: 'Sss Sss',
    //   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKKZDiy4VMILmoJosri_X0m0qhd7tI9QMqCrmlMzm9M4F7EwA=s96-c',
    //   given_name: 'Sss',
    //   family_name: 'Sss',
    //   iat: 1744620938,
    //   exp: 1744624538,
    //   jti: '02d6afa7250a2ee0f047166970d038b37908f196'
    // }
    const { sub: googleId, email, given_name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Пов'язую Google ID із наявним користувачем
        user.googleId = googleId;
      } else {
        // Унікальний номер:
        const playerGameId = await generateUniquePlayerGameId();

        // Створення нового користувача
        user = new User({
          googleId,
          email,
          name: given_name || `User_${googleId}`,
          avatarURL: picture,
          playerGameId,
        });
      }
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, SECRET_KEY, {
      expiresIn: "23h",
    });
    user.token = jwtToken;
    await user.save();

    res.json({ ...user._doc, token: jwtToken });
  } catch (error) {
    throw HttpError({ status: 401, message: "Invalid Google token" });
  }
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
  googleLogin: tryCatchDecorator(googleLogin),
  getCurrentUser: tryCatchDecorator(getCurrentUser),
  logout: tryCatchDecorator(logout),
  changeAvatar: tryCatchDecorator(changeAvatar),
};
