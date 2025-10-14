require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step1Portainer(confObj, area) {
  const user = confObj.serviceAccount;
  const managers = confObj[area].managers;
  const storagetype = confObj.storage.type.toLowerCase();
  const clusterStorage = confObj.storage.global_share;

  const manager1ip = managers[0];

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmds_1st = [
    `echo $sudopw | sudo -S rm -rf ${clusterStorage}/portainer`,
    `echo $sudopw | sudo -S mkdir -p ${clusterStorage}/portainer`,
    `curl -L https://www.micro-stack.org/portainer/portainer-agent-stack.yml -o portainer-agent-stack.yml`,
    `sed -i "s~/clusterStorage~${clusterStorage}~g" portainer-agent-stack.yml`,
    `echo $sudopw | sudo -S docker stack deploy -c portainer-agent-stack.yml portainer`,
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
      .replaceAll("$manager1ip", manager1ip)
      .replaceAll("$storagetype", storagetype);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, manager1ip, user.username, user.password);
    console.log("### COMPLETE: " + linkup);
    console.log();
  }
}

module.exports = { step1Portainer };
