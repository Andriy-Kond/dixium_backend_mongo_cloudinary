import { Contact } from "../models/contactModel.js";
import { HttpError } from "../utils/HttpError.js";
import { tryCatchDecorator } from "../utils/tryCatchDecorator.js";

const getContacts = async (req, res, next) => {
  //^ Method .find() always returns array.
  const contacts1 = await Contact.find(); // Finds all items in collection
  const contacts2 = await Contact.find({ name: "Andrii8" }); // Will search for an exact match: will find "Andrii8", but not "Andrii" (will return empty array).
  const contacts3 = await Contact.find({}, "name email"); // Returns fields "_id", "name" and "email" only.
  const contacts4 = await Contact.find({}, "-name -email"); // Returns all fields except "name" and "email"

  const { _id: owner } = req.user;

  //~ If necessary insert only id to field "owner":
  // const contacts = await Contact.find({ owner }, "-createdAt -updatedAt"); // Finds items of current owner

  //~ If necessary insert detailed info of user to field "owner" (for example, to avoid making multiple queries to the database) needs add .populate():
  const contacts5 = await Contact.find(
    { owner },
    "-createdAt -updatedAt",
  ).populate("owner", "name email");
  // will go to mongoose model "contactModel", will find field owner, will take id from field "type" (Schema.Types.ObjectId), will find collection in ref ("user"), will find object with  id from Schema.Types.ObjectId in collection "user", and insert this object to field "owner".
  // Second argument indicate what fields needs to insert (name and email). Without this option will return full object with all fields.

  //~ If need use patination
  // req.query contains search params (for example, page and limit for pagination)
  const { page = 1, limit = 10 } = req.query;

  // Mongoose contains built-in pagination system: skip - how many entities need to be skipped from beginning of the database, limit - how many entities need to return
  const skip = (page - 1) * limit;

  const contacts = await Contact.find({ owner }, "-createdAt -updatedAt", {
    skip,
    limit,
  }).populate("owner", "name email");
  // Third argument - settings object.

  res.json(contacts);
};

const getContactById = async (req, res, next) => {
  //^ Method .findOne() returns first match or null
  const contact = await Contact.findOne({ _id: req.params.id }); // Returns first match where _id === req.params.id. Used for search by any field except id.
  const contact2 = await Contact.findById(req.params.id); // Used when you want to search by field "_id"

  // When _id have right format, but that _id not in db, the .findById() returns "null", and you'll get status 404, because check "if (!contact)..." will return "false".
  // When _id format will be wrong you'll get this error (because "contact" will be "true":
  //$ Cast to ObjectId failed for value \"676ed63e31157cbbd0a69a105\" (type string) at path \"_id\" for model \"contact\"
  // and, accordingly, status 500 instead 404.
  // Therefore you should use additional middleware isValidId

  if (!contact) {
    throw HttpError({ status: 404, message: "Not found" });
  }

  res.json(contact);
};

const addContact = async (req, res, next) => {
  //^ Method .create()
  const newContact = await Contact.create({
    ...req.body,
    owner: req.owner,
  });
  res.status(201).json(newContact);
};

const editFullContact = async (req, res, next) => {
  const { id } = req.params;

  // # Move shema validation to routes
  // const { error } = Contact.contactsShema.validate(req.body);
  // if (error) throw HttpError({ status: 400, message: error });

  //^ Method .findByIdAndUpdate(id, obj, {new: true}): first argument must be id, second - updated object, third - for return updated obj (by default it returns old obj)
  const editedContact = await Contact.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!editedContact) throw HttpError({ status: 404, message: "Not found" });

  res.json(editedContact);
};

// Method .findByIdAndUpdate() validating only those fields that it receives. Other fields it not touching.
// So functions editFullContact and editFavorite will be totally the same.
const editFavorite = async (req, res, next) => {
  const { id } = req.params;

  const editedContact = await Contact.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!editedContact) throw HttpError({ status: 404, message: "Not found" });

  res.json(editedContact);
};

//^ For delete Mongoose uses two method (they work the same): .findByIdAndDelete() (ongoing method) or .findByIdAndRemove() (old method)
// These methods deleting obj from db and return this obj. If this object not exist they return "null"
const removeContact = async (req, res, next) => {
  const removedContact = await Contact.findByIdAndDelete(req.params.id);
  if (!removedContact) throw HttpError({ status: 404, message: "Not found" });

  // res.json(removedContact);
  // or:
  res.json({ message: "Delete success" });

  // if need to send 204 status:
  // res.status(204).json({ message: "Delete success" }); - doesn't make sense because 204 status means "No Content". So body will not come anyway.
  // res.status(204).send(); // Will be enough for 204 status
};

export const contactsController = {
  getContacts: tryCatchDecorator(getContacts),
  getContactById: tryCatchDecorator(getContactById),
  addContact: tryCatchDecorator(addContact),
  editFullContact: tryCatchDecorator(editFullContact),
  editFavorite: tryCatchDecorator(editFavorite),
  removeContact: tryCatchDecorator(removeContact),
};
