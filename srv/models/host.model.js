require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Host = db.context.define(
  "Host",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    host: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cluster_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    suffix: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ping: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ssh: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    cluster_node: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    compute_node: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    compute_role: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    storage_node: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    storage_role: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    balancer_node: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    balancer_role: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    local_storage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    local_storage_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    local_compute_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["ip"],
      },
    ],
  },
  {
    timestamps: false,
    tableName: "hosts",
  }
);

module.exports = Host;
