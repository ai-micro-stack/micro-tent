require("module-alias/register");
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Plat = require("@models/plat.model");
const Cluster = require("@models/cluster.model");
const Host = require("@models/host.model");
const { AddPlat, UpdatePlat, UpdateClusters } = require("@utils/stackResource");
const { defaultPlat } = require("@consts/constant");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

Plat.hasMany(Cluster, { foreignKey: "plat_id" });
Cluster.belongsTo(Plat, { foreignKey: "plat_id" });
Cluster.hasMany(Host, { foreignKey: "cluster_id" });
Host.belongsTo(Cluster, { foreignKey: "cluster_id" });

async function setDefault() {
  try {
    const [plat, created] = await Plat.findOrCreate({
      where: { plat_name: defaultPlat.plat_name },
      defaults: { ...defaultPlat, id: 0 },
    });
    if (created) console.log("Default plat is created:", plat.toJSON());
    await Cluster.update({ plat_id: plat.id }, { where: { plat_id: null } });
  } catch (err) {
    console.log("Error finding or creating default plat:", err);
  }
}

router.get(
  "/data",
  // verifyToken,
  // grantAccess([1, 2, 3, 9]),
  async (req, res) => {
    await setDefault();
    try {
      await Plat.findAll({
        // where: {
        //   [Op.and]: [
        //     {
        //       plat_name: { [Op.notLike]: defaultPlat.plat_name },
        //     },
        //     { plat_name: { [Op.ne]: "" } },
        //   ],
        // },
        include: [
          {
            model: Cluster,
            required: false,
            where: {
              [Op.or]: [
                { cluster_name: { [Op.notLike]: "-- available hosts --" } },
                { plat_id: { [Op.is]: null } },
              ],
            },
            include: {
              model: Host,
              attributes: [
                "id",
                "ip",
                "host",
                "compute_node",
                "compute_role",
                "storage_node",
                "storage_role",
                "balancer_node",
                "balancer_role",
              ],
              required: false,
              where: { cluster_node: true },
            },
          },
        ],
      }).then((result) => {
        const plats = result.map((p) => {
          const clusters = p.Clusters.map((c) => {
            const compute_nodes = c.Hosts.filter((h) => h.compute_node).length;
            const storage_nodes = c.Hosts.filter((h) => h.storage_node).length;
            const balancer_nodes = c.Hosts.filter(
              (h) => h.balancer_node
            ).length;
            return {
              admin_subnet: c.Subnet?.cidr,
              cluster_id: c.id,
              cluster_name: c.cluster_name,
              cluster_nodes: c.Hosts.length,
              compute_nodes: compute_nodes,
              storage_nodes: storage_nodes,
              balancer_nodes: balancer_nodes,
              // cluster_status: c.Hosts.length ? storage_nodes : 0, //dummy data
              //
              plat_member: c.plat_member,
              balancer_cluster_vip: c.balancer_cluster_vip,
              balancer_protocol: c.balancer_protocol,
              balancer_port: c.balancer_port,
              embedding_member: c.embedding_member,
              embedding_model: c.embedding_model,
              vectordb_member: c.vectordb_member,
              vectordb_vendor: c.vectordb_vendor,
              llm_member: c.llm_member,
              llm_model: c.llm_model,
              compute_cluster_type: c.compute_cluster_type,
              storage_cluster_type: c.storage_cluster_type,
              storage_cluster_share: c.storage_cluster_share,
              balancer_cluster_type: c.balancer_cluster_type,
              Hosts: c.Hosts,
            };
          });
          return {
            id: p.id,
            plat_name: p.plat_name,
            plat_note: p.plat_note,
            plat_type: p.plat_type,
            plat_vip: p.plat_vip,
            is_active: p.is_active,
            is_locked: p.is_locked,
            build_auto_lock: p.build_auto_lock,
            embedding_model_server: p.embedding_model_server,
            embedding_model_store: p.embedding_model_store,
            llm_model_server: p.llm_model_server,
            llm_model_store: p.llm_model_store,
            vectordb_data_server: p.vectordb_data_server,
            vectordb_data_store: p.vectordb_data_store,
            createdAt: p.createdAt,
            updatedAT: p.updatedAt,
            Clusters: clusters,
          };
        });
        return res.status(200).json(plats);
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send(err);
    }
  }
);

router.post("/save", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { plat_0, plat_id, Clusters } = req.body;
  const Members = Clusters.map((n) => {
    return {
      ...n,
      plat_id: n.plat_member ? plat_id : plat_0,
    };
  });
  try {
    UpdateClusters(Members).then(() => {
      return res.status(200).json({});
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/create", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { id, ...plat } = req.body;
  try {
    AddPlat(plat).then((result) => {
      return res.status(200).json(result);
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/update", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const plat = req.body;
  try {
    UpdatePlat(plat).then(async (result) => {
      return res.status(200).json(result);
    });
  } catch (err) {
    return res.status(500).send(err);
    plat;
  }
});

router.delete("/delete", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const platId = String(req.headers["x-plat-id"]);
  const plat = await Plat.findByPk(platId);
  if (!plat) {
    return res.status(202).json({ message: `Record not found: ${platId}` });
  } else {
    await plat
      .destroy()
      .then((result) => {
        return res.status(200).json({
          message: "Record deleted successfully.",
          entity: `${JSON.stringify(result)}`,
        });
      })
      .catch((error) => {
        return res.status(400).json({
          message: `Unable to delete record! ${error}`,
        });
      });
  }
});

module.exports = router;
