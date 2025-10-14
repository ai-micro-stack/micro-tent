require("module-alias/register");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const { spawn } = require("child_process");
const { AddTask } = require("@utils/taskQueue");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Static = require("@models/static.model");
const { AddStatics } = require("@utils/stackResource");
const StackInterface = require("@utils/stackInterface");
// const { shellStream } = require("@utils/taskShellStream");
const { parseStaticData } = require("@utils/rackStaticParser");
const { ssh2Stream } = require("@utils/taskSsh2Stream");
const ping = require("ping");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

// to support ssh2Stream at line-200
const dotenv = require("dotenv");
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { CLUSTER_USER, CLUSTER_PASS, CLUSTER_CERT } = process.env;

const rackDir = "./modules/rack";
const confDir = `${rackDir}/config`;
// const setupDir = `${rackDir}/pxe/ipxe`;
// const ConfFile = `${confDir}/pxe-server.conf`;

router.get("/clients", async (req, res) => {
  try {
    await Static.findAll({}).then((result) => {
      return res.status(200).json({
        Statics: result.sort((a, b) => a.hostname.localeCompare(b.hostname)),
      });
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/parse", verifyToken, grantAccess([1, 2]), async (req, res) => {
  console.log("Parse dhcp conf process is called.");

  const itemList = [];
  for (item in req.body) {
    itemList.push(`${confDir}/${item}.dhcp`);
  }
  const lastUpload = itemList.pop();
  try {
    const data = fs.readFileSync(lastUpload, "utf8");
    const statics = parseStaticData(data);
    await AddStatics(statics);
    return res.status(201).send({ status: "PARSE_COMPLETE_SUCCESSFULLY" });
  } catch (err) {
    return res.status(500).send(`Failed to parse dhcp static conf: ${err}`);
  }
});

router.post("/create", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const staticRow = req.body;
  const hasStatic = await Static.findOne({
    where: { mac_address: staticRow.mac_address },
  });
  if (hasStatic) {
    return res.status(202).json({
      message: `Static exist already: ${staticRow.mac_address}`,
    });
  }
  const dhcpStatic = { ...staticRow };
  await AddStatics([dhcpStatic])
    .then((result) => {
      return res.status(200).json({
        message: "Record created successfully.",
        entity: result,
      });
    })
    .catch((error) => {
      return res.status(400).json({
        message: `Unable to create record! ${error}`,
      });
    });
});

router.post("/update", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const staticRow = req.body;
  const dhcpStatic = await Static.findOne({
    where: { mac_address: staticRow.mac_address },
  });
  if (!dhcpStatic) {
    return res.status(202).json({
      message: `Static not found: ${staticRow.mac_address}`,
    });
  }
  // dhcpStatic.mac_address = staticRow.mac_address;
  dhcpStatic.ipv4_address = staticRow.ipv4_address;
  dhcpStatic.ipv6_address = staticRow.ipv6_address;
  dhcpStatic.hostname = staticRow.hostname;
  dhcpStatic.lease_time = staticRow.lease_time;
  dhcpStatic.is_active = staticRow.is_active;
  dhcpStatic.pingable = staticRow.pingable;

  await dhcpStatic
    .save()
    .then((result) => {
      return res.status(200).json({
        message: "Record updated successfully.",
        entity: result,
      });
    })
    .catch((error) => {
      return res.status(400).json({
        message: `Unable to update record! ${error}`,
      });
    });
});

router.post("/delete", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const selectedMacs = req.body;
  try {
    await Static.destroy({
      where: { mac_address: selectedMacs },
    }).then(() => {
      return res.status(200).send({ status: "SAVE_COMPLETE_SUCCESSFULLY" });
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/apply", verifyToken, grantAccess([1, 2]), async (req, res) => {
  try {
    const tagBegin = `### PXE.STATIC_CONF_BEGIN ###\n`;
    const tagEnd = `### PXE.STATIC_CONF_END ###\n`;
    const regex =
      /### PXE.STATIC_CONF_BEGIN ###\n[\s\S]*?### PXE.STATIC_CONF_END ###\n/g;

    const staticData = await Static.findAll({
      where: { is_active: true },
    });
    const sorted = staticData.sort((a, b) =>
      a.hostname.localeCompare(b.hostname)
    );
    let pxe_statics = tagBegin;
    sorted.forEach((h) => {
      pxe_statics += `dhcp-host=${h.mac_address},${h.ipv4_address},${h.hostname},${h.lease_time}\n`;
    });
    pxe_statics += tagEnd;

    let oldContent = fs.readFileSync("/etc/dnsmasq.conf", "utf8");
    let modifiedText = oldContent.replace(regex, "");
    modifiedText += pxe_statics;
    fs.writeFileSync("/tmp/dnsmasq.conf", modifiedText);

    const cmds = [
      `sudo su`,
      `systemctl stop dnsmasq`,
      `rm -f /etc/dnsmasq.conf`,
      `yes | cp -rf /tmp/dnsmasq.conf /etc/dnsmasq.conf`,
      `rm -f /var/lib/misc/dnsmasq.leases`,
      `systemctl start dnsmasq`,
    ];

    const host = "localhost";
    result = await ssh2Stream(cmds, host, CLUSTER_USER, CLUSTER_PASS);
    // result = await shellStream(cmds);

    return res.status(200).json({ statics: staticData });
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/ping", verifyToken, grantAccess([1, 2]), async (req, res) => {
  try {
    const staticData = await Static.findAll({
      where: { is_active: true },
    });
    let pinging = staticData.map((host) => {
      return ping.promise.probe(host.ipv4_address);
    });
    const pingValues = await Promise.all(pinging);

    for (let i = 0; i < staticData.length; i++) {
      // staticData[i].pingable = pingValues[i].alive;
      Static.update(
        { pingable: pingValues[i].alive },
        {
          where: {
            mac_address: staticData[i].mac_address,
            ipv4_address: staticData[i].ipv4_address,
          },
        }
      );
    }

    // await AddStatics(pingingData);
    return res.status(201).send({ status: "COMPLETE_HOST_PRING_SUCCESSFULLY" });
  } catch (err) {
    return res.status(500).send(err);
  }
});

module.exports = router;
