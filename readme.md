# Packages

- `express` - create server package
- `logger` - HTTP request logger middleware for node.js
- `cors` - Enable CORS: allows cross-requests from different addresses.
- `Joi` - Checking request body: schema description language and data validator
- `multer` - Allows upload files together with fields
- [`gravatar`](https://www.npmjs.com/package/gravatar) - Generate avatars
- `axios` - для відправки запитів на google captcha

#### For render to render.com needs add to package.json:

```js
  "engines": {
    "node": "20.11" // current version on my PC
  }
```

todo: Обмежити кількість гравців до макс 12 людин

try to node v22 - ніби працює.

# MongoDB:

Офіційна документація MongoDB: https://www.mongodb.com/docs/manual/reference/operator/query/

Список усіх операторів: https://www.mongodb.com/docs/manual/reference/operator/

```
Оператори порівняння:
  $gt: Більше (field: { $gt: value }).
  $gte: більше або дорівнює (>=). (field: { $gte: value }).
  $lt: менше (<). (field: { $lt: value }).
  $lte: менше або дорівнює (<=). (field: { $lte: value }).
  $eq: дорівнює (==). (field: { $eq: value }).
  $ne: не дорівнює (!=). (field: { $ne: value }).
  $in: Збігається з будь-яким значенням у масиві (field: { $in: [value1, value2] }).
  $nin: Не збігається з жодним значенням у масиві (field: { $nin: [value1, value2] }).
```

```js
await User.updateMany({ _id: { $in: playerIds } }, { userActiveGameId: null });
// _id: { $in: playerIds }: Шукає всіх користувачів, чиї _id є в масиві playerIds.
// Дія: Оновлює поле userActiveGameId до null для всіх знайдених користувачів.
```

```
Логічні оператори:
  $and: Усі умови повинні бути істинними ({ $and: [{ field1: value1 }, { field2: value2 }] }).
  $or: Хоча б одна умова істинна ({ $or: [{ field1: value1 }, { field2: value2 }] }).
  $not: Інвертує умову (field: { $not: { $eq: value } }).
  $nor: Жодна з умов не істинна ({ $nor: [{ field1: value1 }, { field2: value2 }] }).

Оператори для масивів:
    $all: Поле містить усі вказані значення (field: { $all: [value1, value2] }).
    $elemMatch: Хоча б один елемент масиву відповідає умові (field: { $elemMatch: { subfield: value } }).
    $size: Масив має певну довжину (field: { $size: 3 }).

Оператори для оновлення:
    $set: Встановлює значення поля ({ $set: { field: value } }).
    $unset: Видаляє поле ({ $unset: { field: "" } }).
    $inc: Збільшує числове значення ({ $inc: { field: 1 } }).
    $push: Додає елемент до масиву ({ $push: { field: value } }).
    $pull: Видаляє елемент із масиву ({ $pull: { field: value } }).

Оператори для роботи з регулярними виразами:
    $regex: Пошук за регулярним виразом (field: { $regex: "pattern", $options: "i" }).

Геопросторові оператори:
    $near: Пошук точок поблизу заданої координати.
    $geoWithin: Пошук точок у межах певної області.

Інші:
    $exists: Перевіряє, чи існує поле (field: { $exists: true }).
    $type: Перевіряє тип поля (field: { $type: "string" }).
```

# socket watch stream

```js
const changeStream = Game.watch(); // ??? await Game.watch() ???
changeStream.on("change", change => {
  // console.log("change:::", change);
  console.log(
    "change.updateDescription.updatedFields :>> ",
    change?.updateDescription?.updatedFields,
  );
  console.log("Зміни в БД");

  switch (change.operationType) {
    case "delete":
      console.log("delete :>> ");
      // io.emit("delete", change);
      break;
    case "insert":
      console.log("insert :>> ");
      // io.emit("insert", change);
      handleGameCreate(gameData);
      break;
    case "update":
      const updatedFields = Object.keys(change.updateDescription.updatedFields);

      if (updatedFields.includes("isGameRunning")) {
        console.log(" updatedFields :>>isGameRunning ");
        handleNewPlayersOrder();
      }

      if (updatedFields.includes("players")) {
        // Перший гравець передається як об'єкт у масиві players:
        if (Array.isArray(updatedFields.players)) {
          newPlayer = updatedFields.players.at(-1); // Останній гравець у масиві
        } else {
          // Наступні гравці передаються як окремі об'єкти - частинки масиву players, але після ключу "players.1:{}" для другого гравця, "players.2:{} для третього гравця тощо"
          // Шукаємо поле 'players.X'
          const playerKey = Object.keys(updatedFields).find(key =>
            key.startsWith("players."),
          );
          if (playerKey) {
            newPlayer = updatedFields[playerKey];
          }
        }

        if (newPlayer) {
          console.log(`Новий гравець: ${newPlayer.name}`);
          // Передати `newPlayer` всім клієнтам
          handleStartOrJoinToGame({
            gameId: change.documentKey,
            player: newPlayer,
          });
          // io.emit("updateGame", {
          //   gameId: change.documentKey._id,
          //   eventType: "PLAYER_JOINED",
          // });
        }
      }

      if (updatedFields.includes("isGameStarted")) {
        io.emit("updateGame", {
          gameId: change.documentKey._id,
          eventType: "GAME_STARTED",
        });
      }
      // io.emit("update", change);
      break;
    default:
      io.emit("unknown", { message: "Unknown DB event" });
  }
});
```
