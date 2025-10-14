require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step1Balancer(confObj) {
  // const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;
  const workers = confObj.original["Worker"];
  const managers = confObj.original["Control-Plane"].map((manager) => {
    return { ip: manager, availability: workers.includes(manager) };
  });
  const manager1ip = managers[0].ip;
  const balancer = confObj.balancer;

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmds_1st = [
    `echo $sudopw | sudo -S microk8s enable metallb:$virtualIp`,
    // `sleep 20`,
  ];

  cmds = cmds_1st
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  console.log("###############################################");
  console.log("## ssh2 session with: " + manager1ip);
  console.log("###############################################");
  for (let i = 0; i < cmds.length; i++) {
    cmd = cmds[i]
      .replaceAll("$sudopw", user.password)
      .replaceAll("$linkup", linkup)
      .replaceAll("$virtualIp", balancer.virtualIp)
      .replaceAll("$manager1ip", manager1ip);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, manager1ip, user.username, user.password);
    console.log("### COMPLETE: " + linkup);
    console.log();
  }
}

module.exports = { step1Balancer };
