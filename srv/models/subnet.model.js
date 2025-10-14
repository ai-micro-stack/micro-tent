require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Subnet = db.context.define(
  "Subnet",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    interface_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    netmask: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    family: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mac: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    internal: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    cidr: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scopeid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ip4_class: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip4_netaddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip4_begin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip4_end: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip4_router: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip4_dnslist: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip4_dnsdomain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "subnets",
  }
);

module.exports = Subnet;
