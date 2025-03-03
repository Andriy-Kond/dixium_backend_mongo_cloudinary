import { masculine, feminine, neuter } from "../resources/adjectivesNouns.js";
import { rhymingPairs } from "../resources/rhymingPairs.js";

import { getRandomItem } from "./getRandomItem.js";

export const generateGameName = () => {
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
