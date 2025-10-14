require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Pxe = db.context.define(
  "Pxe",
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
    pxe_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pxeRoot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imgRoot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pxeAuto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    TFTP_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    HTTP_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    NFS_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    iSCSI_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    SMB_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DHCP_PROXY: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DHCP_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DNS_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    NTP_SERVER: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ISO_UTILS: {
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
    tableName: "pxes",
  }
);

module.exports = Pxe;
