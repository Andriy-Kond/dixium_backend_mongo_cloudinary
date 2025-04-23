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
  const foundUser = await User.findOne({ email }); // Find user with this email. If not found, returns "null"
  if (foundUser) {
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
    playerGameId, // type: Number()
    googleId: "",
    appleId: "",
    userActiveGameId: "",
  });

  newUser.token = jwt.sign({ id: newUser._id }, SECRET_KEY, {
    expiresIn: "23h",
  });

  await newUser.save();

  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    token: newUser.token,
    avatarURL: newUser.avatarURL,
    playerGameId: newUser.playerGameId,
    userActiveGameId: newUser.userActiveGameId,
  });
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
  // await User.findByIdAndUpdate(user._id, { token: jwtToken }); // !!! Тут не працює, бо у res.json відправляються дані по старому токену!
  user.token = jwtToken;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: user.token,
    avatarURL: user.avatarURL,
    playerGameId: user.playerGameId,
    userActiveGameId: user.userActiveGameId,
  });
  // console.log(" login >> ...user._doc,:::", user._doc);
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

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: user.token,
      avatarURL: user.avatarURL,
      playerGameId: user.playerGameId,
      userActiveGameId: user.userActiveGameId,
    });
  } catch (error) {
    throw HttpError({ status: 401, message: "Invalid Google token" });
  }
};

// Check whether token is still valid and send name&email
const getCurrentUser = (req, res) => {
  // console.log(" getCurrentUser >> req.user:::", req.user);
  //   getCurrentUser >> req.user::: {
  //   _id: new ObjectId('67fe6ea01bd21e525b20cd38'),
  //   name: 'Andy',
  //   email: 'akwebua.study@gmail.com',
  //   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmU2ZWEwMWJkMjFlNTI1YjIwY2QzOCIsImlhdCI6MTc0NTQxMjIzOCwiZXhwIjoxNzQ1NDk1MDM4fQ.IHt5wEZD5wWrIH7leqAyX_2O3EUwlqFG9Et0y3CAV8I',
  //   avatarURL: 'https://lh3.googleusercontent.com/a/ACg8ocIACoD4tEdhI_Qz577wYK2mCchqK5aa31q-kLGbdRhIEFanm3E=s96-c',
  //   googleId: '113888083265055069149',
  //   playerGameId: 2680,
  //   createdAt: 2025-04-15T14:35:12.958Z,
  //   updatedAt: 2025-04-23T12:43:58.222Z,
  //   userActiveGameId: ''
  // }

  // Запит /api/auth/current — це GET-запит, який не містить тіла (req.body).
  // Токен уже перевіряється в middleware authenticate. Якщо токен не валідний, запит не дійде до getCurrentUser.
  // Повертати весь об'єкт req.user не можна, бо там є чутливі дані наприклад, хеш пароля.
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    token: req.user.token,
    avatarURL: req.user.avatarURL,
    playerGameId: req.user.playerGameId,
    userActiveGameId: req.user.userActiveGameId,
  });
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
