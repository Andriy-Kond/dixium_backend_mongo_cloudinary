//% 1. Отримання списку файлів у теці(наприклад, deck_01)
// import { cloudinary } from "./cloudinaryConfig";
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
  secure: true,
});

export async function getImagePath(folderName) {
  const response = await cloudinary.api.resources({
    type: "upload",
    prefix: folderName + "/", // Отримати всі файли у теці
    max_results: 100, // Можна змінити, щоб отримати більше файлів
  });

  return response.resources.map(file => ({
    public_id: file.public_id,
    url: file.secure_url,
  }));
}

// Використання
// getImagesFromCloudinaryFolder("deck_01").then(console.log).catch(console.error);

// result:
// [
//   {
//     public_id: "deck_01/image_1",
//     url: "https://res.cloudinary.com/your_cloud_name/image/upload/v123456789/deck_01/image_1.jpg",
//   },
//   {
//     public_id: "deck_01/image_2",
//     url: "https://res.cloudinary.com/your_cloud_name/image/upload/v123456789/deck_01/image_2.jpg",
//   },
// ];

//% 2. Використання колекцій (Collections) у Cloudinary
// Cloudinary API не надає прямого способу отримати список файлів з Collection (тільки теги або папки). Однак, якщо ти додаєш усі файли колекції у спільний тег, ти можеш отримати список файлів за тегом.
// Отримати всі файли з тегом deck_01:
// async function getImagesByCloudinaryTag(tag) {
//   const response = await cloudinary.api.resources_by_tag(tag);

//   return response.resources.map(file => ({
//     public_id: file.public_id,
//     url: file.secure_url,
//   }));
// }

// Використання
// getImagesByCloudinaryTag("deck_01").then(console.log).catch(console.error);
