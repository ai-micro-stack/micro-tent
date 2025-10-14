require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Static = db.context.define(
  "Static",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    subnet_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mac_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipv4_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipv6_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hostname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lease_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    pingable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "statics",
  }
);

module.exports = Static;
