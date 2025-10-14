require("module-alias/register");
const { DataTypes } = require("sequelize");
const { db } = require("@database/db");

const Cluster = db.context.define(
  "Cluster",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    plat_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    plat_member: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    embedding_member: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    embedding_model: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vectordb_member: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    vectordb_vendor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    llm_member: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    llm_model: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // generic info
    subnet_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cluster_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cluster_note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    build_auto_lock: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    // load balancer
    balancer_cluster_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    balancer_cluster_vip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    balancer_protocol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    balancer_port: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    peer_interface: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    peer_pass_secret: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // compute cluster
    compute_cluster_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    compute_cluster_dashboard: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    local_compute_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },

    // storage ckuster
    storage_cluster_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    storage_cluster_share: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    storage_cluster_dashboard: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    local_storage_type: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    local_storage_default: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["subnet_id", "cluster_name"],
      },
    ],
  },
  {
    timestamps: false,
    tableName: "clusters",
  }
);

module.exports = Cluster;
