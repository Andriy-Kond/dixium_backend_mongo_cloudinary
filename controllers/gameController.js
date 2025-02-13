import { Game } from "../models/gameModel.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

import { masculine, feminine, neuter } from "../resources/adjectivesNouns.js";
import { rhymingPairs } from "../resources/rhymingPairs.js";

// const adjectives = ["Чарівний", "Загадковий", "Містичний", "Мудрий", "Забутий"];
// const nouns = ["Шепіт", "Легенда", "Сон", "Світло", "Тінь"];
// const rhymingPairs = [
//   "Мелодія Мрій",
//   "Загадки Вітру",
//   "Фантазія Слів",
//   "Тінь Історії",
//   "Шепіт Долі",
// ];

const getRandomItem = arr => arr[Math.floor(Math.random() * arr.length)];

const generateGameName = () => {
  const genders = { masculine, feminine, neuter };
  const genderKey = getRandomItem(["masculine", "feminine", "neuter"]);
  const gender = genders[genderKey];

  const adjective = getRandomItem(gender.adjectives);
  const noun = getRandomItem(gender.nouns);

  const rhymingPair = getRandomItem(rhymingPairs);
  const useRhyming = Math.random() > 0.5; // 50% шанс використати риму

  const gameName = useRhyming ? rhymingPair : `${adjective} ${noun}`;

  return gameName;
};

const getAllGames = async (req, res) => {
  console.log("get all games");
  const games = await Game.find();
  // console.log("getAllGames >> games:::", games);

  res.json(games);
};

const createGame = async (req, res) => {
  console.log("creating new game");

  // const newGame = await Game.create(req.body); // First db query
  // newGame.gameName = generateGameName();
  // newGame.gameTitle = getRandomItem(newGame.deck).url;
  // await newGame.save(); // Second db query

  const newGame = new Game(req.body);
  newGame.gameName = generateGameName();
  newGame.gameTitle = getRandomItem(newGame.deck).url;
  await newGame.save(); // One single db query

  res.status(201).json(newGame);
};

export const gameController = {
  getAllGames: tryCatchDecorator(getAllGames),
  createGame: tryCatchDecorator(createGame),
};
