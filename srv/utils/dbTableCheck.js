require("module-alias/register");
const { QueryTypes } = require("sequelize");
const { db } = require("@database/db");

const dbTableCheck = (tableName) => {
  // return a Promise of {count: 1 or 0}
  return db.context.query(
    "SELECT count(*) as count FROM sqlite_master WHERE type = ? AND name = ?",
    {
      replacements: ["table", tableName],
      type: QueryTypes.SELECT,
      plain: true,
      raw: true,
    }
  );
};

module.exports = dbTableCheck;
