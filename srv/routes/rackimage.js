require("module-alias/register");
const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const { AddTask } = require("@utils/taskQueue");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

const rackDir = "./modules/rack";
// const confDir = `${rackDir}/config`;
const setupDir = `${rackDir}/pxe/ipxe`;
// const ConfFile = `${confDir}/pxe-server.conf`;

router.post("/mount", verifyToken, grantAccess([1, 2]), (req, res) => {
  console.log("Load-new-iso-image process is called.");

  let itemlist = "";
  let delimiter = "";
  for (item in req.body) {
    console.log(item);
    itemlist += delimiter + item + ".iso";
    delimiter = ",";
  }

  try {
    const taskUser = req.user.userId || "unknown";
    const taskData = {
      type: "ssh2",
      cmd: `./3-pxe-boot-image.sh -i ${itemlist}; exit`,
      cwd: "./srv/modules/rack/pxe/ipxe",
    };
    AddTask(taskUser, JSON.stringify(taskData));
  } catch (err) {
    console.log(err);
  }
  return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });
});

router.post("/remount", verifyToken, grantAccess([1, 2]), (req, res) => {
  console.log("Reload-all-image process is called.");
  try {
    const taskUser = req.user.userId || "unknown";
    const taskData = {
      type: "ssh2",
      cmd: "./3-pxe-boot-image.sh -r Y",
      cwd: "./srv/modules/rack/pxe/ipxe",
    };
    AddTask(taskUser, JSON.stringify(taskData));
  } catch (err) {
    console.log(err);
  }
  return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });
});

router.post("/menu", verifyToken, grantAccess([1, 2]), (req, res) => {
  const defaultBoot = String(req.headers["default-boot-os"]);
  console.log(`Repopulate boot menu with "${defaultBoot}" as the default.`);
  try {
    const menu = spawn("./4-pxe-boot-menu.sh", [defaultBoot], {
      // shell: "/bin/bash",
      // maxBuffer: 2048 * 1024,
      cwd: `${setupDir}`,
      // stdio: "pipe",
      encoding: "utf8",
    });

    menu.stdout.on("data", (data) => {
      console.log(`menu stdout: ${data}`);
    });

    menu.stderr.on("data", (data) => {
      console.error(`menu stderr: ${data}`);
    });

    menu.on("close", (code) => {
      console.log(`menu process exited with code ${code}`);
      res.status(201).send({ status: "BOOT_MENU_POPULATED" });
    });
  } catch (err) {
    if (err.code) {
      console.error(err.code);
      res.status(500).send(`Failed to start menu populating: ${err}`);
      res.end();
    } else {
      const { stdout, stderr } = err;
      console.error({ stdout, stderr });
      res.status(500).send(`Failed to complete menu populating: ${err}`);
      res.end();
    }
  }
});

module.exports = router;
