# Packages

- `express` - create server package
- `logger` - HTTP request logger middleware for node.js
- `cors` - Enable CORS: allows cross-requests from different addresses.
- `Joi` - Checking request body: schema description language and data validator
- `multer` - Allows upload files together with fields
- [`gravatar`](https://www.npmjs.com/package/gravatar) - Generate avatars

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
await User.updateMany({ _id: { $in: playerIds } }, { userActiveGameId: "" });
// _id: { $in: playerIds }: Шукає всіх користувачів, чиї _id є в масиві playerIds.
// Дія: Оновлює поле userActiveGameId до порожнього рядка ("") для всіх знайдених користувачів.
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
