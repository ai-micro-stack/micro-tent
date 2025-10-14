require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Interface = db.context.define(
  "Interface",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    nic_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nic_mac: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["nic_mac", "nic_name"],
      },
    ],
  },
  {
    timestamps: false,
    tableName: "interfaces",
  }
);

module.exports = Interface;
