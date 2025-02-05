//% 1. Отримання списку файлів у теці(наприклад, deck_01)
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "your_cloud_name",
  api_key: "your_api_key",
  api_secret: "your_api_secret",
});

export async function getImagesFromFolder(folderName) {
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
// getImagesFromFolder("deck_01").then(console.log).catch(console.error);

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
// async function getImagesByTag(tag) {
//   const response = await cloudinary.api.resources_by_tag(tag);

//   return response.resources.map(file => ({
//     public_id: file.public_id,
//     url: file.secure_url,
//   }));
// }

// Використання
// getImagesByTag("deck_01").then(console.log).catch(console.error);
