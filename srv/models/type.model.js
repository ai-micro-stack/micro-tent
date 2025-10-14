require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Type = db.context.define(
  "Type",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "types",
  }
);

module.exports = Type;
