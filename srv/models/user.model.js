require("module-alias/register");
const { DataTypes, Sequelize } = require("sequelize");
const { db } = require("@database/db");

const User = db.context.define(
  "User",
  {
    uuid: {
      type: DataTypes.TEXT,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "users",
    // indexes: [
    //   {
    //     name: "idx_username_password",
    //     unique: false,
    //     fields: ["username", "password"],
    //   },
    // ],
  }
);

module.exports = User;
