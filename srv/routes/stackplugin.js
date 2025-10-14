require("module-alias/register");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");
const { AddTask } = require("@utils/taskQueue");
// const { StackModules } = require("@utils/stackModules");
const { ScanStackModules } = require("@utils/stackModules");
const { stackExtractZip } = require("@utils/stackExtractZip");
const { pluginModuleTypes } = require("@consts/constant");

const platDir = "./modules/plat";
const tentDir = "./modules/tent";
const rackDir = "./modules/rack";

const setupDir = `${rackDir}/pxe/ipxe`;
const confDir = `${rackDir}/config`;
const ConfFile = `${confDir}/pxe-server.conf`;

const pxeBootRoot = fs
  .readFileSync(`${ConfFile}`, "utf8")
  .split(/\r?\n/)
  .map((line) => {
    return line.split("#")[0].trim();
  })
  .filter((line) => {
    return line.length && line.startsWith("pxeRoot=");
  })
  .map((line) => {
    return line.split("=")[1].replace(/^"|"$/g, "");
  });

const pxeRoot = pxeBootRoot[0] ? pxeBootRoot[0] : "/pxeboot";
const isoStore = `${pxeRoot}/os-store/`;
const plgStore = `${setupDir}/plugin/`;
const cfgStore = `${rackDir}/config/`;
const rackStore = `${rackDir}/config/`;
const tenttore = `${tentDir}/config/`;
const platStore = `${platDir}/config/`;

const channelToFileStore = {
  isoUpload: isoStore,
  plgUpload: plgStore,
  cfgUpload: cfgStore,
  rackPlugin: rackStore,
  tentPlugin: tenttore,
  platPlugin: platStore,
};

router.get("/type/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];
  if (!fileStore)
    return res.status(500).send({ status: "No plugin store assigned." });
  const stack = req.params.channel.replace("Plugin", ""); // need "rack", "plat" or "plat"
  const moduleTypes = pluginModuleTypes[`${stack}Plugin`];

  const pluginDir = path.join(fileStore, "..");
  const pluginMdb = path.join(pluginDir, "module.mdb");

  const pluginFiles = fs.readdirSync(fileStore).filter((item) => {
    const itemPath = `${fileStore}${item}`;
    return fs.statSync(itemPath).isFile() && path.extname(itemPath) === ".zip";
  });

  let pluginMounts = [];
  const pluginTypes = fs
    .readdirSync(pluginDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);

  for (const pt of pluginTypes) {
    const fullPath = path.join(pluginDir, pt);
    const plugins = fs
      .readdirSync(fullPath, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => item.name);
    for (const pn of plugins) {
      pluginMounts.push(pt + "." + pn);
    }
  }

  let pluginFounds = [];
  if (!fs.existsSync(pluginMdb)) {
    ScanStackModules(stack, moduleTypes, pluginMdb);
  }
  pluginData = fs.readFileSync(pluginMdb, "utf-8");
  pluginJson = JSON.parse(pluginData);
  moduleKeys = Object.keys(pluginJson);
  moduleKeys.forEach((key) => {
    for (i = 1; i < pluginJson[key].length; i++) {
      const pluginType = key.replace("Modules", "");
      const plaginName = pluginJson[key][i].moduleName;
      const plaginStatus = pluginJson[key][i].moduleStatus;
      if (plaginStatus > 0) pluginFounds.push(pluginType + "." + plaginName);
    }
  });

  const pluginNames = [
    ...new Set([
      ...pluginFiles.map((zipFile) => path.basename(zipFile, ".zip")),
      ...pluginMounts,
      ...pluginFounds,
    ]),
  ];

  const detailes = pluginNames.map((fullName) => {
    const pluginFile = fullName + ".zip";
    const pluginType = fullName.split(".")[0];
    const pluginName = fullName.replace(new RegExp(`^${pluginType}.`), "");
    return {
      fullName,
      pluginName,
      pluginType,
      pluginFile,
      fileExists: pluginFiles.includes(pluginFile),
      mountExists: pluginMounts.includes(fullName),
      foundExists: pluginFounds.includes(fullName),
    };
  });

  const pluginContext = moduleTypes.map((t) => {
    return {
      pluginType: t,
      pluginList: detailes.filter((p) => p.pluginType === t),
    };
  });

  res.send(pluginContext);
});

router.post("/mount/:channel", async (req, res) => {
  console.log(req.params.channel);
  console.log(JSON.stringify(req.body, null, 4));

  const fileStore = channelToFileStore[req.params.channel];
  if (!fileStore)
    return res.status(500).send({ status: "No plugin store assigned." });
  const stack = req.params.channel.replace("Plugin", ""); // need "rack", "plat" or "plat"
  const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
  // const moduleDatabase = path.join(
  //   __dirname,
  //   `../modules/${stack}`,
  //   `module.mdb`
  // );

  const pluginDir = path.join(fileStore, "..");
  const pluginMdb = path.join(pluginDir, "module.mdb");

  for (item in req.body) {
    console.log(item);
    let nameSegments = item.split(".");
    if (nameSegments.length < 2) continue;
    const moduleType = nameSegments[0];
    nameSegments.shift();
    const moduleName = nameSegments.join(".");
    if (!moduleTypes.includes(moduleType)) continue;
    const filePath = path.join(fileStore, item + ".zip");
    const modulePath = path.join(pluginDir, moduleType, moduleName);

    if (fs.existsSync(filePath)) {
      await stackExtractZip(filePath, modulePath, true);
    } else {
      try {
        fs.rmSync(modulePath, { recursive: true });
      } catch (err) {}
    }
  }

  // try {
  //   const taskUser = req.user.userId || "unknown";
  //   const taskData = {
  //     type: "shell",
  //     cmd: `./3-pxe-boot-image.sh -i ${itemlist}`,
  //     cwd: "./srv/modules/rack/pxe/ipxe",
  //   };
  //   AddTask(taskUser, JSON.stringify(taskData));
  // } catch (err) {
  //   console.log(err);
  // }
  ScanStackModules(stack, moduleTypes, pluginMdb);
  return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });
});

router.post("/remount/:channel", (req, res) => {
  const fileStore = channelToFileStore[req.params.channel];
  if (!fileStore)
    return res.status(500).send({ status: "No plugin store assigned." });

  // try {
  //   const taskUser = req.user.userId || "unknown";
  //   const taskData = {
  //     type: "shell",
  //     cmd: "./3-pxe-boot-image.sh -r Y",
  //     cwd: "./srv/modules/rack/pxe/ipxe",
  //   };
  //   AddTask(taskUser, JSON.stringify(taskData));
  // } catch (err) {
  //   console.log(err);
  // }

  return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });
});

module.exports = router;
