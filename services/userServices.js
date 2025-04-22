import { User } from "../models/userModel.js";

export const updateUserActiveGameId = async ({ gameId, userId }) => {
  console.log("updateUserActiveGameId");

  const user = await User.findById(userId);
  if (!user)
    return {
      errorMessage: `Error: user with gameId ${gameId} not found`,
    };

  user.userActiveGameId = gameId;
  await user.save();

  return { user };
};
