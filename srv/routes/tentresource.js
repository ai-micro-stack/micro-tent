require("module-alias/register");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Cluster = require("@models/cluster.model");
const Host = require("@models/host.model");
// const { cidrParser } = require("@utils/stackParser");
const { AddHosts, GetHostsByCidr, portPing } = require("@utils/stackResource");
const { ScanStackModules } = require("@utils/stackModules");
const md5 = require("md5");
const ping = require("ping");
const StackInterface = require("@utils/stackInterface");
const { ssh2Promise } = require("@utils/taskSsh2Promise");
// const { ssh2Stream } = require("@utils/taskSsh2Stream");
const { defaultCluster } = require("@consts/constant");
const { pluginModuleTypes } = require("@consts/constant");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

const stack = "tent";
const dotenv = require("dotenv");
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { CLUSTER_USER, CLUSTER_PASS, CLUSTER_CERT } = process.env;

const user = {
  username: CLUSTER_USER,
  password: CLUSTER_PASS,
  usercert: CLUSTER_CERT,
};

router.get("/hosts", async (req, res) => {
  const nicData = await StackInterface();

  Interface.hasMany(Subnet, { foreignKey: "interface_id" });
  Subnet.belongsTo(Interface, { foreignKey: "interface_id" });
  Subnet.hasMany(Cluster, { foreignKey: "subnet_id" });
  Cluster.belongsTo(Subnet, { foreignKey: "subnet_id" });
  Cluster.hasMany(Host, { foreignKey: "cluster_id" });
  Host.belongsTo(Cluster, { foreignKey: "cluster_id" });
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

router.post("/scan", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { subnet_id, subnet_cidr, subnet_prefix } = req.body;

  // scan cluster built modules
  const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
  const moduleDatabase = path.join(
    __dirname,
    `../modules/${stack}`,
    `module.mdb`
  );
  ScanStackModules(stack, moduleTypes, moduleDatabase);

  await Subnet.update({ prefix: subnet_prefix }, { where: { id: subnet_id } });
  const dftCluster = await Cluster.findOne({
    where: {
      ...defaultCluster,
      subnet_id: subnet_id,
    },
  });
  const potentialHosts = (
    await GetHostsByCidr(subnet_id, subnet_cidr, subnet_prefix)
  ).filter((p) => {
    return p.ip !== subnet_cidr.split("/")[0];
  });

  let tcpping = potentialHosts.map((host) => {
    return portPing(host.ip, 22);
  });
  const tcppValues = await Promise.all(tcpping);

  let pinging = potentialHosts.map((host) => {
    return ping.promise.probe(host.ip);
  });
  const pingValues = await Promise.all(pinging);

  const tcppable = tcppValues.filter((p) => p.alive);
  const pingable = pingValues.filter((p) => p.alive);

  const inUseHosts = await Host.findAll({
    attributes: ["ip"],
    where: { ip: potentialHosts.map((h) => h.ip), cluster_node: true },
  });

  try {
    await AddHosts(
      potentialHosts
        .filter((h) => {
          return (
            inUseHosts.length === 0 ||
            !inUseHosts.some((e) => {
              return e.ip === h.ip;
            })
          );
        })
        .map((h) => {
          return {
            ip: h.ip,
            host: subnet_prefix + "-" + h.suffix,
            cluster_id: dftCluster.id,
            suffix: h.suffix,
            ping: pingable.find((p) => p.host === h.ip) ? true : false,
            ssh: tcppable.find((p) => p.host === h.ip) ? true : false,
          };
        })
        .filter((h) => h.ping || h.ssh)
    );
    return res.status(200).json({ tcpp: tcppable, ping: pingable });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.post("/save", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { cluster_id, Hosts } = req.body;
  const removal = Hosts.filter(
    (h) => !(h.is_active || h.cluster_node || h.compute_node || h.storage_node)
  ).map((h) => h.ip);
  try {
    AddHosts(Hosts).then(async () => {
      await Host.destroy({ where: { cluster_id, ip: removal } });
      return res.status(200).json({});
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/name", verifyToken, grantAccess([1, 2]), async (req, res) => {
  try {
    const hosts = await Host.findAll({
      where: { is_active: true },
      attributes: ["ip", "host"],
    });

    const command = `echo $sudopw | sudo -S hostnamectl set-hostname $host`;
    let cmd = "";

    hosts.forEach(async (h) => {
      cmd = command
        .replaceAll("$sudopw", user.password)
        .replaceAll("$host", h.host);
      await ssh2Promise(cmd, h.ip, user.username, user.password);
    });

    return res.status(200).json({ hosts: hosts });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/dnsr", verifyToken, grantAccess([1, 2]), async (req, res) => {
  try {
    const tagBegin = `### HCI.RESOURCE_BEGIN ###\n`;
    const tagEnd = `### HCI.RESOURCE_END ###\n`;
    const regex =
      /### HCI.RESOURCE_BEGIN ###\n[\s\S]*?### HCI.RESOURCE_END ###\n/g;

    const hosts = await Host.findAll({
      where: { is_active: true },
      attributes: ["ip", "host"],
    });
    const sorted = hosts.sort((a, b) => a.host.localeCompare(b.host));
    let hci_hosts = tagBegin;
    sorted.forEach((h) => {
      hci_hosts += `${h.ip}\t${h.host}\n`;
    });
    hci_hosts += tagEnd;

    let oldContent = fs.readFileSync("/etc/hosts", "utf8");
    let modifiedText = oldContent.replace(regex, "");
    modifiedText += hci_hosts;
    fs.writeFileSync("/tmp/hosts", modifiedText);

    // check the updated hosts file with shell command: cat /tmp/hosts
    // after configuring the hosts obtain the fixed ips from DHCP,
    // then update the credential and enable function all down below to pop /etc/hosts file

    /*
    ssh2Promise(
      "yes | sudo cp -rf /tmp/hosts /etc/hosts",
      "localhost",
      "<appuser>",
      "<appuser>"
    );
    */

    const cmds = [
      `echo $sudopw | sudo -S cat /etc/hosts > /tmp/hosts`,
      `echo $sudopw | sudo -S sed -i "/### HCI.RESOURCE_BEGIN/,/HCI.RESOURCE_END ###\\n/d" /tmp/hosts`,
      `echo $sudopw | sudo -S echo "${hci_hosts}" >> /tmp/hosts`,
      `echo $sudopw | sudo -S cp -rf /tmp/hosts /etc/hosts`,
    ];
    let cmd = "";

    hosts.forEach(async (h) => {
      for (let j = 0; j < cmds.length; j++) {
        cmd = cmds[j].replaceAll("$sudopw", user.password);
        await ssh2Promise(cmd, h.ip, user.username, user.password);
      }
    });

    return res.status(200).json({ hosts: hci_hosts });
  } catch (err) {
    return res.status(500).send(err);
  }
});

module.exports = router;
