require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Resource = db.context.define(
  "Resource",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "resources",
  }
);

module.exports = Resource;
