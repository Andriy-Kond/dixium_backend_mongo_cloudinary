import cloudinary from "./cloudinaryConfig.js";

// Отримати список усіх файлів у теці
export async function getImagePath(folderName) {
  const response = await cloudinary.api.resources({
    type: "upload",
    prefix: folderName, // Отримати всі файли у теці
    max_results: 100, // Можна змінити, щоб отримати більше файлів
  });

  return response.resources.map(file => ({
    cardName: file.public_id.split("/").pop(),
    public_id: file.public_id,
    url: file.secure_url,
  }));
}

// Отримання списку всіх тек
export async function getAllFolders(prefix = "dixium") {
  const response = await cloudinary.api.sub_folders(prefix, {
    max_results: 500, // Максимальна кількість тек, які повертаються
  });

  return response.folders.map(folder => folder.name);
}
