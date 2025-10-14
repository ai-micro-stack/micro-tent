const Sequelize = require("sequelize");
const context = new Sequelize({
  host: "localhost",
  dialect: "sqlite",
  storage: "./database/pxe.db",
  // disable logging; default: console.log
  logging: false,
});

context
  .authenticate()
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Error: ", err));

exports.db = { context };
