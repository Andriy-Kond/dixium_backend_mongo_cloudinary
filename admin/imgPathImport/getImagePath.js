import cloudinary from "./cloudinaryConfig.js";

export async function getImagePath(folderName) {
  const response = await cloudinary.api.resources({
    type: "upload",
    prefix: folderName + "/", // Отримати всі файли у теці
    max_results: 100, // Можна змінити, щоб отримати більше файлів
  });

  return response.resources.map(file => ({ url: file.secure_url }));
}
