export const handleMongooseError = (error, data, next) => {
  // When you register new user with the same email, the Mongoose model check it by key "unique: true" and throw error:
  // "message": "E11000 duplicate key error collection: phone_book_db.users index: email_1 dup key: { email: \"andrii@vestibul.co.uk\" }"

  // So for all others errors we must send status 400, but for unique error - 409
  const { name, code } = error;
  console.log("handleMongooseError >> code:::", code); // 11000
  console.log("handleMongooseError >> name:::", name); // MongoServerError

  error.status = code === 11000 && name === "MongoServerError" ? 409 : 400;

  next();
};
