require("module-alias/register");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { StackModules } = require("@utils/stackModules");
const { PopulateTentObject } = require("@utils/tentObject");
const tentDir = "./modules/tent";
const confDir = `${tentDir}/config`;
const { AddTask } = require("@utils/taskQueue");
const { pluginModuleTypes } = require("@consts/constant");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

const stack = "tent";

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

router.post("/conf", verifyToken, grantAccess([1, 2]), (req, res) => {
  const adminHostIpv4 = req.body.Subnet.cidr.split("/")[0];
  const currentCluster = req.body.Cluster;
  const clusterMembers = req.body.Hosts;
  const taskUser = req.user.userId || "unknown";

  try {
    const confObject = PopulateTentObject(
      adminHostIpv4,
      currentCluster,
      clusterMembers
    );
    if (confObject.code !== 0) {
      return res
        .status(500)
        .send({ status: JSON.stringify(confObject.data, null, 2) });
    }

    const taskObj = confObject.data;
    const clusterJson = `${confDir}/cluster-${currentCluster.id.toString()}_${taskUser}.json`;
    fs.writeFileSync(clusterJson, JSON.stringify(taskObj, null, 4));

    return res.status(201).send({ status: "SAVE_SETTINGS_COMPLETED" });
  } catch (err) {
    res.status(500).send(`Failed to save ai platform settings: ${err}`);
    res.end();
  }
});

router.post("/build", verifyToken, grantAccess([1, 2]), async (req, res) => {
  console.log("The cluster-build-process is called.");
  const adminHostIpv4 = req.body.Subnet.cidr.split("/")[0];
  const currentCluster = req.body.Cluster;
  const clusterMembers = req.body.Hosts;
  const taskUser = req.user.userId || "unknown";

  try {
    const confObject = PopulateTentObject(
      adminHostIpv4,
      currentCluster,
      clusterMembers
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
    //     cwd: `./srv/modules/tent/cluster/${taskObj.compute.type}`,
    //   };
    //   AddTask(taskUser, JSON.stringify(taskData));
    // } catch (err) {
    //   console.log(err);
    // }
    // return res.status(201).send({ status: "MOUNT_COMPLETE_SUCCESSFULLY" });

    const taskObj = confObject.data;
    const taskPayload = `${confDir}/cluster-${currentCluster.id.toString()}_${taskUser}.payload`;
    fs.writeFileSync(taskPayload, JSON.stringify(taskObj));

    // const moduleTypes = ["storage", "compute", "balancer", "dashboard"];
    const moduleTypes = pluginModuleTypes[`${stack}Plugin`].filter(
      (m) => m !== "dashboard"
    );
    moduleTypes.forEach((area) => {
      if (taskObj[area].type === "(None)") return;
      const taskData = {
        type: "ssh2",
        cmd: `node ${tentDir}/${area}/${taskObj[area].type}/index.cjs ${taskPayload}`,
        cwd: `./srv`,
      };
      AddTask(taskUser, JSON.stringify(taskData));
    });

    return res.status(201).send({ status: "APPLYING_SETTINGS_COMPLETED" });
  } catch (err) {
    res.status(500).send(`Failed to build the HCI cluster: ${err}`);
    res.end();
  }
});

router.post("/dash", verifyToken, grantAccess([1, 2]), async (req, res) => {
  const adminHostIpv4 = req.body.Subnet.cidr.split("/")[0];
  const currentCluster = req.body.Cluster;
  const clusterMembers = req.body.Hosts;
  try {
    const confObject = PopulateTentObject(
      adminHostIpv4,
      currentCluster,
      clusterMembers
    );
    if (confObject.code === 0) {
      const taskUser = req.user.userId || "unknown";
      const taskObj = confObject.data;
      const taskPayload = `${confDir}/cluster-${currentCluster.id.toString()}_${taskUser}.payload`;
      fs.writeFileSync(taskPayload, JSON.stringify(taskObj));

      const moduleTypes = pluginModuleTypes[`${stack}Plugin`].filter(
        (m) => m !== "dashboard"
      );
      // const moduleTypes = ["compute"];

      moduleTypes.forEach((area) => {
        const dashboardType = taskObj[area].dashboard ?? "(None)";
        if (dashboardType === "(None)") return;
        const taskData = {
          type: "ssh2",
          cmd: `node ${tentDir}/dashboard/${dashboardType}/index.cjs ${taskPayload} ${area}`,
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
