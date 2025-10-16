require("module-alias/register");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { StackModules } = require("@utils/stackModules");
const { PopulatePlatObject } = require("@utils/platObject");
const platDir = "./modules/plat";
const confDir = `${platDir}/config`;
const { AddTask } = require("@utils/taskQueue");
const { pluginModuleTypes } = require("@consts/constant");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

// const moduleDatabase = path.join(__dirname, "../modules/plat", `module.mdb`);
// const moduleTypes = ["embedding", "vectordb", "llm"];
// const stack = "plat";
const stack = "plat";

router.get("/modules", async (req, res) => {
  const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
  const moduleDatabase = path.join(
    __dirname,
    `../modules/${stack}`,
    `module.mdb`
  );

  try {
    const platModules = StackModules(stack, moduleTypes, moduleDatabase);
    return res.status(200).json({ ...platModules });
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.post("/conf", verifyToken, grantAccess([1, 2]), (req, res) => {
  // const adminHostIpv4 = req.body.Subnet.cidr.split("/")[0];
  const currentPlat = req.body.Plat;
  const platMembers = req.body.Clusters;
  const taskUser = req.user.userId || "unknown";

  try {
    const confObject = PopulatePlatObject(
      // adminHostIpv4,
      currentPlat,
      platMembers
    );
    if (confObject.code !== 0) {
      return res
        .status(500)
        .send({ status: JSON.stringify(confObject.data, null, 2) });
    }

    const taskObj = confObject.data;
    const platJson = `${confDir}/plat-${currentPlat.id.toString()}_${taskUser}.json`;
    fs.writeFileSync(platJson, JSON.stringify(taskObj, null, 4));

    return res.status(201).send({ status: "SAVE_SETTINGS_COMPLETED" });
  } catch (err) {
    res.status(500).send(`Failed to save ai platform settings: ${err}`);
    res.end();
  }
});

router.post("/build", verifyToken, grantAccess([1, 2]), async (req, res) => {
  console.log("The plat-build-process is called.");
  // const adminHostIpv4 = req.body.Subnet.cidr.split("/")[0];
  const taskTarget = req.body.Target; // target: "server" or "model"
  const currentPlat = req.body.Plat;
  const platMembers = req.body.Clusters;
  const taskUser = req.user.userId || "unknown";

  try {
    const confObject = PopulatePlatObject(
      // adminHostIpv4,
      currentPlat,
      platMembers
    );
    if (confObject.code !== 0) {
      return res
        .status(500)
        .send({ status: JSON.stringify(confObject.data, null, 2) });
    }

    // const taskObj = confObject.data;
    // try {
    //   const taskUser = req.user.userId || "unknown";
    //   const taskData = {
    //     type: "ssh2",
    //     cmd: "ls *.js",
    //     cwd: `./srv/modules/tent/plat/${taskObj.compute.type}`,
    //   };
    //   AddTask(taskUser, JSON.stringify(taskData));
    // } catch (err) {
    //   console.log(err);
    // }
    // return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });

    const taskObj = confObject.data;
    const taskPayload = `${confDir}/plat-${currentPlat.id.toString()}_${taskUser}.payload`;
    fs.writeFileSync(taskPayload, JSON.stringify(taskObj));

    const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
    // const moduleTypes = ["llm"];

    moduleTypes.forEach((area) => {
      // area: embedding, vectordb ot llm
      let members = taskObj[area].members;
      if (taskObj[area].members.length === 0) return;
      for (let i = 0; i < members.length; i++) {
        // member: Kubernets. Server-Farm or Swarm
        let member = members[i];
        let module = member[area + "_module"];
        if (module === "(None)") return;
        // to set taskTarget details
        let taskDetails = JSON.stringify({
          target: taskTarget,
          hci_id: member.hci_id,
        });
        const taskData = {
          type: "ssh2",
          cmd: `node ${platDir}/${area}/${module}/index.cjs ${taskPayload} '${taskDetails}'`,
          cwd: `./srv`,
        };
        AddTask(taskUser, JSON.stringify(taskData));
      }
    });

    return res.status(201).send({ status: "APPLYING_SETTINGS_COMPLETED" });
  } catch (err) {
    res.status(500).send(`Failed to build the AI plat: ${err}`);
    res.end();
  }
});

router.post("/dash", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const adminHostIpv4 = req.body.Subnet.cidr.split("/")[0];
  const currentCluster = req.body.Cluster;
  const clusterMembers = req.body.Clusters;
  try {
    const confObject = PopulatePlatObject(
      adminHostIpv4,
      currentCluster,
      clusterMembers
    );
    if (confObject.code === 0) {
      const taskUser = req.user.userId || "unknown";
      const taskObj = confObject.data;
      const taskPayload = `${confDir}/cluster-${currentCluster.id.toString()}_${taskUser}.payload`;
      fs.writeFileSync(taskPayload, JSON.stringify(taskObj));

      // const moduleTypes = ["embedding", "vectordb", "llm"];
      const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
      moduleTypes.forEach((area) => {
        if (taskObj[area].dashboard === "(None)") return;
        const taskData = {
          type: "ssh2",
          cmd: `node ${platDir}/${area}/${taskObj[area].dashboard}/index.cjs ${taskPayload}`,
          cwd: `./srv`,
        };
        AddTask(taskUser, JSON.stringify(taskData));
      });
    }
    res.status(201).send({ status: "Portainer setup complete" });
  } catch (err) {
    res.status(500).send(`Failed to complete portainer-setup script: ${err}`);
    res.end();
  }
});

module.exports = router;
