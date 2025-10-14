require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function step1KeepAlive(confObj) {
  const nodes = confObj.balancer.members;
  const user = confObj.serviceAccount;

  if (!nodes.length) return;

  let node = "";
  let cmds = [];
  // let cmd = "";
  // let linkup = "";
  let result = "";

  const cmds_inst = [
    "sudo su",
    "apt update -y",
    "NEEDRESTART_MODE=a apt install keepalived -y",
  ];

  cmds = cmds_inst
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let idx in nodes) {
    node = nodes[idx];
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    result = await ssh2Stream(cmds, node, user.username, user.password);
    console.log();
  }
}

module.exports = { step1KeepAlive };
