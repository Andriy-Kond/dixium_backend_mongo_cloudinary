import { Game } from "../models/gameModel.js";

import { masculine, feminine, neuter } from "../resources/adjectivesNouns.js";
import { rhymingPairs } from "../resources/rhymingPairs.js";

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

export const createNewGame = async gameData => {
  console.log("Creating New Game:::");
  const newGame = new Game(gameData);
  newGame.gameName = generateGameName();
  newGame.gameTitle = getRandomItem(newGame.deck).url;
  await newGame.save();

  return newGame;
};
