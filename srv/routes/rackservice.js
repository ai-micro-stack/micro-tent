require("module-alias/register");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const { pluginModuleTypes, rackService } = require("@consts/constant");
const { serviceCheck } = require("@utils/rackSvcFinder");
const { verifyToken, grantAccess } = require("@middleware/authMiddleware");

const rackDir = "./modules/rack";
const confDir = `${rackDir}/config`;
const WorkConf = `${confDir}/pxe-server.json`;
const moduleTypes = pluginModuleTypes.rackPlugin;

router.get(
  "/state",
  verifyToken,
  grantAccess([1, 2, 3, 9]),
  async (req, res) => {
    try {
      const confData = fs.readFileSync(WorkConf, "utf8");
      const confObj = JSON.parse(confData);
      const user = confObj.serviceAccount;
      const pxeRoot = confObj.pxe_environment.pxeRoot;
      const services = moduleTypes.map((t) => {
        return {
          area: t,
          ...rackService[t],
          provider: confObj[t].type,
        };
      });

      const serviceChecking = services.map((s) => {
        return serviceCheck(s.protocol, s.port, user, s.provider, pxeRoot);
      });

      const checkResult = await Promise.all(serviceChecking);

      return res.send(
        services.map((s, i) => {
          return { ...s, pingable: checkResult[i] ? true : false };
        })
      );
    } catch (err) {
      return res.status(500).send(`Failed to parse dhcp static conf: ${err}`);
    }
  }
);

module.exports = router;
