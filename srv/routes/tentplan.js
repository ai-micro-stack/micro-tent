require("module-alias/register");
const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const ping = require("ping");
const { portPing } = require("@utils/stackResource");
const StackInterface = require("@utils/stackInterface");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Cluster = require("@models/cluster.model");
const Host = require("@models/host.model");
const { AddHosts, UpdateCluster, AddCluster } = require("@utils/stackResource");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

Interface.hasMany(Subnet, { foreignKey: "interface_id" });
Subnet.belongsTo(Interface, { foreignKey: "interface_id" });
Subnet.hasMany(Cluster, { foreignKey: "subnet_id" });
Cluster.belongsTo(Subnet, { foreignKey: "subnet_id" });
Cluster.hasMany(Host, { foreignKey: "cluster_id" });
Host.belongsTo(Cluster, { foreignKey: "cluster_id" });

router.get("/data", async (req, res) => {
  const nicData = await StackInterface();
  const macList = nicData.map((n) => n.nic_mac);
  try {
    await Interface.findAll({
      where: { nic_mac: macList },
      include: [
        {
          model: Subnet,
          required: false,
          include: [
            {
              model: Cluster,
              required: false,
              include: [{ model: Host, required: false }],
            },
          ],
        },
      ],
    }).then((result) => {
      return res.status(200).json({ Interfaces: result });
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/save", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { subnet_id, cluster_0, cluster_id, Hosts } = req.body;
  const Nodes = Hosts.map((n) => {
    return {
      ...n,
      cluster_id: n.cluster_node ? cluster_id : cluster_0,
    };
  });
  try {
    AddHosts(Nodes).then(() => {
      return res.status(200).json({});
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/create", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { id, ...cluster } = req.body;
  try {
    AddCluster(cluster).then((result) => {
      return res.status(200).json(result);
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/update", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const cluster = req.body;
  try {
    let updating = { ...cluster };

    const existed = await Cluster.findOne({
      where: { id: cluster.id },
    });

    const cluster_type_reset =
      (existed.compute_cluster_type ?? 0) &&
      existed.compute_cluster_type !== cluster.compute_cluster_type;
    const storage_type_reset =
      (existed.storage_cluster_type ?? 0) &&
      existed.storage_cluster_type !== cluster.storage_cluster_type;
    const balancer_type_reset =
      (existed.balancer_cluster_type ?? 0) &&
      existed.balancer_cluster_type !== cluster.balancer_cluster_type;

    /* handle server-side-process of is_locked */

    UpdateCluster(updating).then(async (result) => {
      if (cluster_type_reset) {
        await Host.update(
          { compute_role: 0 },
          { where: { cluster_id: updating.id } }
        );
      }
      if (storage_type_reset) {
        await Host.update(
          { storage_role: 0 },
          { where: { cluster_id: updating.id } }
        );
      }
      if (balancer_type_reset) {
        await Host.update(
          { balancer_role: 0 },
          { where: { cluster_id: updating.id } }
        );
      }
      return res.status(200).json(result);
    });
  } catch (err) {
    return res.status(500).send(err);
    cluster;
  }
});

router.get(
  "/tents",
  verifyToken,
  // grantAccess([1, 2, 3, 9]),
  async (req, res) => {
    try {
      await Cluster.findAll({
        where: {
          [Sequelize.Op.and]: [
            {
              cluster_name: { [Sequelize.Op.notLike]: "-- available hosts --" },
            },
            { cluster_name: { [Sequelize.Op.ne]: "" } },
          ],
        },
        include: [
          { model: Subnet, required: false },
          {
            model: Host,
            required: false,
            where: { cluster_node: true },
          },
        ],
      }).then(async (result) => {
        const cluster_ping = result.map((c) => {
          return ping.promise.probe(c.balancer_cluster_vip?.split("/")[0]);
        });
        const cluster_port = result.map((c) => {
          return portPing(
            c.balancer_cluster_vip?.split("/")[0],
            c.balancer_port ? c.balancer_port : "80"
          );
        });

        const ping_result = await Promise.all(cluster_ping);
        const port_result = await Promise.all(cluster_port);
        const clusters = result.map((c, i) => {
          const compute_nodes = c.Hosts.filter((h) => h.compute_node).length;
          const storage_nodes = c.Hosts.filter((h) => h.storage_node).length;
          const balancer_nodes = c.Hosts.filter((h) => h.balancer_node).length;
          const cluster_status = c.balancer_cluster_vip
            ? ping_result[i].alive || port_result[i].alive
            : null;
          return {
            admin_subnet: c.Subnet?.cidr,
            cluster_id: c.id,
            balancer_cluster_vip: c.balancer_cluster_vip,
            balancer_protocol: c.balancer_protocol,
            balancer_port: c.balancer_port,
            cluster_name: c.cluster_name,
            cluster_nodes: c.Hosts.length,
            compute_cluster_type: c.compute_cluster_type,
            compute_nodes: compute_nodes,
            storage_cluster_type: c.storage_cluster_type,
            storage_nodes: storage_nodes,
            balancer_cluster_type: c.balancer_cluster_type,
            balancer_nodes: balancer_nodes,
            cluster_status: cluster_status,
          };
        });
        return res.status(200).json({ clusters: clusters });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send(err);
    }
  }
);

module.exports = router;
