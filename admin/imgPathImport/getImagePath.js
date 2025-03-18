import cloudinary from "./cloudinaryConfig.js";

// Отримати список усіх файлів у теці
export async function getImagePath(folderName) {
  const response = await cloudinary.api.resources({
    type: "upload",
    prefix: folderName, // Отримати всі файли у теці
    max_results: 150, // Можна змінити, щоб отримати більше файлів (за замовчуванням - 10)
  });

  // // Без трансформації:
  //   return response.resources.map(file => ({
  //     cardName: file.public_id.split("/").pop(),
  //     public_id: file.public_id,
  //     url: file.secure_url,
  //   }));

  // З трансформацією:
  return response.resources.map(file => {
    const transformedUrl = cloudinary.url(file.public_id, {
      transformation: [
        {
          width: 500,
          height: 800,
          crop: "scale", // Масштабує зображення до точних розмірів без обрізання

          // crop: "fit", // Зображення масштабується, зберігаючи пропорції, і вписується в межі 500x800

          // З фоном:
          // crop: "pad", // Додає заповнення (padding), якщо пропорції не збігаються
          // background: "auto", // Автоматично підбирає колір фону
        },
      ],
      secure: true, // Використовуємо HTTPS
    });

    return {
      cardName: file.public_id.split("/").pop(),
      public_id: file.public_id,
      url: transformedUrl, // Оновлений URL із трансформацією
    };
  });
}

// Отримання списку всіх тек
export async function getAllFolders(prefix = "dixium") {
  const response = await cloudinary.api.sub_folders(prefix, {
    max_results: 500, // Максимальна кількість тек, які повертаються
  });

  return response.folders.map(folder => folder.name);
}
