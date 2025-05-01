import "dotenv/config";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

import { User } from "../models/userModel.js";
import { HttpError } from "../utils/HttpError.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";
import { OAuth2Client } from "google-auth-library";
import { generateUniquePlayerGameId } from "../utils/generateUniquePlayerGameId.js";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";
import { sendResetPasswordEmail } from "../utils/sendResetPasswordEmail.js";

const { SECRET_KEY = "", GOOGLE_CLIENT_ID = "" } = process.env;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  console.log("register >>>");
  //# Adding custom error message for 409 status when you validate uniq field (for example "email")
  const { email, password } = req.body;

  const foundUser = await User.findOne({ email }); // If not found, returns "null"
  if (foundUser) {
    if (foundUser.googleId && !foundUser.password) {
      throw HttpError({
        status: 409,
        message: `This email is registered via Google. Sign in via Google or set a password to enable sign-in with email&password.`,
      });
    }

    if (foundUser.isEmailVerified) {
      throw HttpError({
        status: 409,
        message: `Email already exists and confirmed`,
      });
    } else {
      throw HttpError({
        status: 409,
        message: `Email already registered but not verified. Please verify your email.`,
      });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const defaultAvatarURL = gravatar.url(email, {
    s: 200,
    protocol: true,
    d: "robohash",
  });

  // Унікальний номер
  const playerGameId = await generateUniquePlayerGameId();
  const verificationToken = nanoid();
  const emailVerificationDeadline = new Date(Date.now() + 168 * 60 * 60 * 1000); // 24 години (168 годин)

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL: defaultAvatarURL,
    playerGameId, // type: Number()
    // googleId: null,
    // appleId: null,
    // userActiveGameId: null,
    verificationToken,
    emailVerificationDeadline,
  });

  // Надіслати верифікаційний лист
  await sendVerificationEmail({ to: email, verificationToken });

  // Create and send token
  const jwtToken = jwt.sign({ id: newUser._id }, SECRET_KEY, {
    expiresIn: "23h",
  });
  newUser.token = jwtToken;
  await newUser.save();

  // Метод res.cookie встановлює cookie у відповіді HTTP.
  // "token": Ім’я cookie, яке буде збережено в браузері.
  // jwtToken: Значення cookie, у цьому випадку JWT-токен.
  res.cookie("token", jwtToken, {
    httpOnly: true, // Робить cookie недоступним для JavaScript (наприклад, через document.cookie). Захищає від XSS-атак, оскільки зловмисний скрипт не може вкрасти токен.
    secure: process.env.NODE_ENV === "production", // Використовувати secure у продакшені. Якщо true, cookie надсилається лише через HTTPS
    // secure: true,
    sameSite: "strict", // Контролює, коли cookie надсилається в запитах:
    // "strict" - Cookie надсилається лише в запитах із того ж сайту (наприклад, якщо користувач переходить за посиланням із вашого домену).
    // Це захищає від CSRF-атак, оскільки cookie не надсилається в запитах із зовнішніх сайтів.
    // "lax" - дозволяє деякі крос-сайтові запити, наприклад, GET-посилання
    // "none" - дозволяє всі крос-сайтові запити, але вимагає secure: true.
    maxAge: 23 * 60 * 60 * 1000, // 23 години. Після закінчення цього часу браузер автоматично видаляє cookie
  });

  // const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
  //   expiresIn: "7d",
  // });

  // await User.findByIdAndUpdate(user._id, { token: jwtToken, refreshToken });

  // res.cookie("token", jwtToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  // });

  // res.cookie("refreshToken", refreshToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: 7 * 24 * 60 * 60 * 1000,
  // });

  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    token: newUser.token, // todo прибрати при переході на cookie.
    avatarURL: newUser.avatarURL,
    playerGameId: newUser.playerGameId,
    // userActiveGameId: newUser.userActiveGameId,
  });
};

const verifyEmail = async (req, res) => {
  // якщо у sendVerificationEmail використовувати
  // verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`:
  // const { token } = req.query;
  // const user = await User.findOne({ verificationToken: token });

  // якщо у sendVerificationEmail використовувати
  // verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-email/${verificationToken}`:
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError({
      status: 404,
      message: "Invalid or expired verification token", // "Недійсний або прострочений верифікаційний токен"
    });
  }

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    verificationToken: null,
    emailVerificationDeadline: null,
  });

  // res.json({ message: "Email verified successfully" }); // "Email успішно верифіковано"
  res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`); // перенаправить користувача на цю адресу після успішної верифікації
};

const resendVerificationEmail = async (req, res) => {
  const { _id, email, isEmailVerified } = req.user;

  if (isEmailVerified) {
    throw HttpError({ status: 400, message: "Email already verified" });
  }

  const verificationToken = nanoid();
  const emailVerificationDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await User.findByIdAndUpdate(_id, {
    verificationToken,
    emailVerificationDeadline,
  });

  await sendVerificationEmail({
    to: email,
    verificationToken,
  });

  res.json({ message: "Verification email sent successfully" });
};

// const refreshToken = async (req, res) => {
//   const { refreshToken } = req.cookies;
//   if (!refreshToken) {
//     throw HttpError({ status: 401, message: "Немає refresh-токена" });
//   }

//   const user = await User.findOne({ refreshToken });
//   if (!user) {
//     throw HttpError({ status: 401, message: "Недійсний refresh-токен" });
//   }

//   const newJwtToken = jwt.sign({ id: user._id }, SECRET_KEY, {
//     expiresIn: "23h",
//   });
//   const newRefreshToken = jwt.sign(
//     { id: user._id },
//     process.env.REFRESH_SECRET,
//     {
//       expiresIn: "7d",
//     },
//   );

//   await User.findByIdAndUpdate(user._id, {
//     token: newJwtToken,
//     refreshToken: newRefreshToken,
//   });

//   res.cookie("token", newJwtToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "strict",
//   });
//   res.cookie("refreshToken", newRefreshToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "strict",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });

//   res.json({ message: "Токен оновлено" });
// };

const login = async (req, res) => {
  console.log("login");
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError({
      status: 401,
      message: `User not found. The email or password is wrong or not registered.`,
    });
  }

  if (!user.isEmailVerified && new Date() > user.emailVerificationDeadline) {
    throw HttpError({
      status: 403,
      message: "Email not verified. Please verify your email.",
    });
  }

  // Перевірка, чи є пароль у користувача (тобто чи це лише Google-користувач чи ні)
  if (!user.password) {
    throw HttpError({
      status: 401,
      message: `This account is registered via Google. Please use Google sign-in or set a password.`,
    });
  }

  const comparePass = await bcrypt.compare(password, user.password); // it is async operation
  if (!comparePass) {
    throw HttpError({ status: 401, message: `Email or password is wrong.` });
  }

  // Create and send token
  const jwtToken = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "23h" });
  // await User.findByIdAndUpdate(user._id, { token: jwtToken }); // !!! Тут не працює, бо у res.json відправляються дані по старому токену!
  user.token = jwtToken;
  await user.save();

  res.cookie("token", jwtToken, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production", // Використовувати secure у продакшені
    secure: true,
    sameSite: "strict",
    maxAge: 23 * 60 * 60 * 1000, // 23 години
  });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: user.token, // todo прибрати при переході на cookie.
    avatarURL: user.avatarURL,
    playerGameId: user.playerGameId,
    // userActiveGameId: user.userActiveGameId,
  });

  // console.log(" login >> ...user._doc,:::", user._doc);
};

// Дозволити авторизованим користувачам Google встановлювати пароль.
// Вимога - щоб користувач був авторизований (через Google) і вказав новий пароль.
const setPassword = async (req, res) => {
  const { password } = req.body;
  const { _id } = req.user; // req.user додається у middleware authenticate.js

  if (!password)
    throw HttpError({ status: 400, message: "Password is required!" });

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(_id, { password: hashedPassword });

  res.json({ message: "Setup password success!" });
};

const setNickname = async (req, res) => {
  const { nickname } = req.body;
  const { _id } = req.user; // req.user додається у middleware authenticate.js

  if (!nickname) throw HttpError({ status: 400, message: "Name is required!" });

  await User.findByIdAndUpdate(_id, { name: nickname });

  res.json({ message: "Setup name success!", name: nickname });
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
        // Прив’язка Google ID до існуючого користувача email/пароль
        user.googleId = googleId;
        user.avatarURL = user.avatarURL || picture; // Оновлення аватара, якщо не встановлено
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
          isEmailVerified: true,
        });
      }

      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, SECRET_KEY, {
      expiresIn: "23h",
    });
    user.token = jwtToken;
    await user.save();

    res.cookie("token", jwtToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production", // Використовувати secure у продакшені
      secure: true,
      sameSite: "strict",
      maxAge: 23 * 60 * 60 * 1000, // 23 години
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: user.token, // todo прибрати при переході на cookie.
      avatarURL: user.avatarURL,
      playerGameId: user.playerGameId,
      // userActiveGameId: user.userActiveGameId,
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
    token: req.user.token, // todo прибрати при переході на cookie.
    avatarURL: req.user.avatarURL,
    playerGameId: req.user.playerGameId,
    // userActiveGameId: req.user.userActiveGameId,
  });
};

// email, на який треба відправити відновлення паролю:
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError({
      status: 404,
      message: "User with this email does not exist.",
    });
  }

  const resetToken = nanoid();
  const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // термін дії токена 1 година

  await User.findByIdAndUpdate(user._id, {
    resetToken,
    resetTokenExpiry,
  });

  await sendResetPasswordEmail({ to: email, resetToken });

  res.json({ message: "Password reset email sent successfully." });
  res.redirect(`${process.env.FRONTEND_URL}/login?reset=true`);
};

// скидання паролю
const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetToken,
    resetTokenExpiry: { $gt: new Date() }, // greater than: MongoDB шукатиме документи, де значення поля resetTokenExpiry більше, ніж поточний час. Якщо resetTokenExpiry <= поточному часу, токен вважається простроченим, і користувач не знайдеться (user буде null).
  });

  if (!user) {
    throw HttpError({
      status: 400,
      message: "Invalid or expired reset token.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
  });

  res.json({ message: "Password reset successfully." });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  // todo При переході на cookie - видалити токен і на клієнті через .clearCookie:
  // res.clearCookie("token", {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "strict",
  // });

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
  verifyEmail: tryCatchDecorator(verifyEmail),
  login: tryCatchDecorator(login),
  googleLogin: tryCatchDecorator(googleLogin),
  getCurrentUser: tryCatchDecorator(getCurrentUser),
  forgotPassword: tryCatchDecorator(forgotPassword),
  resetPassword: tryCatchDecorator(resetPassword),
  logout: tryCatchDecorator(logout),
  changeAvatar: tryCatchDecorator(changeAvatar),
  setPassword: tryCatchDecorator(setPassword),
  setNickname: tryCatchDecorator(setNickname),
  resendVerificationEmail: tryCatchDecorator(resendVerificationEmail),
};
