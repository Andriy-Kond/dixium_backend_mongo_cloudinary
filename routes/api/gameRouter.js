// * Move functions to gameController.js

import express from "express";
import { gameController } from "../../controllers/gameController.js";
// import { authenticate } from "../../middlewares/authenticate.js";
// import { checkErrorJoiSchemaDecorator } from "../../middlewares/checkErrorJoiSchemaDecorator.js";
// import { joiContactSchemas } from "../../models/contactModel.js";
// import { isValidId } from "../../middlewares/isValidId.js";

export const gameRouter = express.Router();

// gameRouter.get("/", authenticate, gameController.getDesks);
gameRouter.get("/", gameController.getDesks);

// gameRouter.get("/:id", authenticate, isValidId, gameController.getContactById);

// // * local middlewares "checkErrorJoiSchemaDecorator" for each request:
// gameRouter.post(
//   "/",
//   authenticate,
//   checkErrorJoiSchemaDecorator(joiContactSchemas.addContact),
//   gameController.addContact,
// );

// // Route for update all fields
// gameRouter.put(
//   "/:id",
//   authenticate,
//   isValidId,
//   checkErrorJoiSchemaDecorator(joiContactSchemas.addContact),
//   gameController.editFullContact,
// );

// // Route for update only one field (for example "favorite")
// gameRouter.patch(
//   "/:id/favorite",
//   authenticate,
//   isValidId,
//   checkErrorJoiSchemaDecorator(joiContactSchemas.editFavorite),
//   gameController.editFavorite,
// );

// gameRouter.delete(
//   "/:id",
//   authenticate,
//   isValidId,
//   gameController.removeContact,
// );
