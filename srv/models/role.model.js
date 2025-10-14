require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Role = db.context.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "roles",
  }
);

module.exports = Role;
