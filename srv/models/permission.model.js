require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Permission = db.context.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "permissions",
    // indexes: [
    //   {
    //     name: "idx_role_resource",
    //     unique: true,
    //     fields: ["role_id", "resource_id"],
    //   },
    // ],
  }
);

module.exports = Permission;
