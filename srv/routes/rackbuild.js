require("module-alias/register");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { StackModules } = require("@utils/stackModules");
const { PopulateRackObject } = require("@utils/rackObject");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Pxe = require("@models/pxe.model");
const { AddSubnets, AddPxe } = require("@utils/stackResource");
const { AddTask } = require("@utils/taskQueue");
const { PopulateRackConf } = require("@utils/rackConfSave");
const { pluginModuleTypes } = require("@consts/constant");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

const stack = "rack";

Interface.hasMany(Subnet, { foreignKey: "interface_id" });
Subnet.belongsTo(Interface, { foreignKey: "interface_id" });
Subnet.hasMany(Pxe, { foreignKey: "subnet_id" });
Pxe.belongsTo(Subnet, { foreignKey: "subnet_id" });

const rackDir = "./modules/rack";
const confDir = `${rackDir}/config`;
const ConfFile = `${confDir}/pxe-server.conf`;
const WorkConf = `${confDir}/pxe-server.json`;

router.get("/modules", async (req, res) => {
  const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
  const moduleDatabase = path.join(
    __dirname,
    `../modules/${stack}`,
    `module.mdb`
  );

  try {
    const tentModules = StackModules(stack, moduleTypes, moduleDatabase);
    return res.status(200).json({ ...tentModules });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.post("/apply", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const { curInterface, curSubnet, curPxe } = req.body;
  const taskUser = req.user.userId || "unknown";
  try {
    // save the changes if made any
    const addedNets = await AddSubnets([curSubnet]);
    const addedPxe = { ...curPxe, subnet_id: addedNets[0].id };
    await AddPxe(addedPxe);

    // populate the config file
    const confContent = PopulateRackConf(curInterface, curSubnet, curPxe);
    fs.writeFileSync(`${ConfFile}`, confContent.data);

    // populate the object file
    const confObject = PopulateRackObject(curInterface, curSubnet, curPxe);
    if (confObject.code !== 0) {
      return res
        .status(500)
        .send({ status: JSON.stringify(confObject.data, null, 2) });
    }
    const taskObj = confObject.data;

    // save json file for human readable
    const pxeJson = `${confDir}/pxe-${curPxe.id.toString()}_${taskUser}.json`;
    fs.writeFileSync(pxeJson, JSON.stringify(taskObj, null, 4));

    // save json file for mudule process use
    const taskPayload = `${confDir}/pxe-${curPxe.id.toString()}_${taskUser}.payload`;
    fs.writeFileSync(taskPayload, JSON.stringify(taskObj));

    // sync changes to the plugin module folder
    try {
      const setupDir = `${rackDir}/pxe/${taskObj.pxe.type}/`;
      // fs.chmodSync(`${setupDir}`, "0755");
      fs.cpSync(`${confDir}`, `${setupDir}/config`, {
        force: true,
        recursive: true,
        preserveTimestamps: true,
      });
    } catch {}

    // remove dnsmasq temporary cache file if exists.
    // which contains the conf of multi-features completed by previous steps
    try {
      fs.unlinkSync("/tmp/dnsmasq.conf");
    } catch {}

    // const moduleTypes = ["pxe", "dhcp", "proxy", "tftp", "http", "nfs", "dns", "ntp"];
    const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
    moduleTypes.forEach((area) => {
      if (taskObj[area].type === "(None)") return;
      const taskData = {
        // type: "ssh2",
        type: "shell",
        cmd: `node ${rackDir}/${area}/${taskObj[area].type}/index.cjs ${taskPayload}`,
        cwd: `./srv`,
      };
      AddTask(taskUser, JSON.stringify(taskData));
    });

    // save the final working config json
    fs.writeFileSync(WorkConf, JSON.stringify(taskObj));

    // // add a task in user's task queue
    // try {
    //   fs.chmodSync(`${setupDir}`, "0755");
    //   fs.cpSync(`${confDir}`, `${setupDir}/config`, {
    //     force: true,
    //     recursive: true,
    //     preserveTimestamps: true,
    //   });

    //   const taskUser = req.user.userId || "unknown";
    //   const taskData = {
    //     type: "shell",
    //     cmd: "./1-pxe-boot-server.sh && ./2-pxe-boot-dnsmasq.sh",
    //     cwd: "./srv/modules/rack/pxe/ipxe",
    //   };
    //   AddTask(taskUser, JSON.stringify(taskData));
    // } catch (err) {
    //   console.log(err);
    // }
    return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });
  } catch (err) {
    return res.status(500).send(err);
  }
});

module.exports = router;
