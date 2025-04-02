import { masculine, feminine, neuter } from "../resources/adjectivesNouns.js";
import { rhymingPairs } from "../resources/rhymingPairs.js";
import { getRandomItem } from "./getRandomItem.js";

export const generateGameName = () => {
  const genders = { masculine, feminine, neuter };
  const genderKey = getRandomItem(["masculine", "feminine", "neuter"]);
  const gender = genders[genderKey];

  const useRhyming = Math.random() > 0.5; // 50% шанс використати риму

  if (useRhyming) return getRandomItem(rhymingPairs);
  else {
    const adjective = getRandomItem(gender.adjectives);
    const noun = getRandomItem(gender.nouns);

    return `${adjective} ${noun}`;
  }
};
