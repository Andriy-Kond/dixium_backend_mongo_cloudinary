//^ The middleware for upload files from fields (for avatars/images)

import multer from "multer";
import path from "path";

// First of all you need put files into temp folder. Where this file will then be moved will be decided in the authController
const __dirname = import.meta.dirname; // here it is path to "middlewares" folder
// console.log("__dirname:::", __dirname);
const tempDir = path.join(__dirname, "../", "temp");
// console.log("tempDir:::", tempDir);

// Settings object for middleware multer:
// const upload = multer({ dest: "uploads/" });
const multerConfig = multer.diskStorage({
  destination: tempDir, // The folder to which the file has been saved

  // The name of the file within the destination (not needs for this example):
  filename: (req, file, cb) => {
    console.log("file:::", file.originalname);

    const fixedFileName = file.originalname.replace(/\s/g, "_"); // replacing all TABs, all SPACESs, all LINE BREAKs.

    console.log("fixedFileName:::", fixedFileName);
    // This regular expression much better than a combination of the two methods "str.split(" ").join("_")" - faster, easier. But if you need change register or find exact symbol you must use split+join.

    // This fn can save file with a different name (not the name it was received with)
    // file - it is the file received and save in memory but not save at storage
    cb(null, fixedFileName); // will save with original name file (In this example the "filename" field is not needs)
    // null - there you can send an error if something goes wrong: cb(new Error('I don't have a clue!'))
  },
});

export const upload = multer({ storage: multerConfig }); // Where to store the files (tempDir + name specified in cb)
