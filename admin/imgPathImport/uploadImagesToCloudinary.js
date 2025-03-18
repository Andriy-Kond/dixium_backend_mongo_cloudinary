import cloudinary from "./cloudinaryConfig.js";
import fs from "fs/promises"; // Для роботи з файловою системою
import path from "path";

// Функція для завантаження одного зображення
async function uploadImage(filePath, folderName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `dixium/${folderName}`, // Тека в Cloudinary
      upload_preset: "ml_default", // Опціонально: ваш пресет для стиснення
    });
    console.log(`Uploaded ${path.basename(filePath)}: ${result.secure_url}`);
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    throw error;
  }
}

// Функція для завантаження всіх зображень із директорії
async function uploadImagesFromFolder(localFolderPath, cloudinaryFolderName) {
  try {
    // Читаємо вміст директорії
    const files = await fs.readdir(localFolderPath);

    // Фільтруємо лише файли зображень (наприклад, .jpg, .png)
    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png|gif)$/i.test(file),
    );

    // Завантажуємо кожне зображення
    for (const file of imageFiles) {
      const filePath = path.join(localFolderPath, file);
      await uploadImage(filePath, cloudinaryFolderName);
    }
    console.log(`All images from ${localFolderPath} uploaded successfully!`);
  } catch (error) {
    console.error("Error uploading images:", error.message);
  }
}

// Приклад виклику
// node ./admin/imgPathImport/uploadImagesToCloudinary.js
const localFolder =
  "d:/Programming/Projects/dixium_backend_mongo_cloudinary/secrets/deck_03"; // Шлях до локальної теки з зображеннями
const cloudinaryFolder = "deck_03"; // Назва теки в Cloudinary
uploadImagesFromFolder(localFolder, cloudinaryFolder);
