require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function step1Swarm(confObj) {
  const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;

  let node = "";
  let cmds = [];
  // let cmd = "";
  // let linkup = "";
  let result = "";

  const cmds_inst = [
    `sudo su`,
    `iptables -F`,
    `snap refresh`,
    `snap install microk8s --channel=1.28/stable --classic`, // addon: rook-ceph since 1.28
    `microk8s status --wait-ready`,
    `modprobe rbd`,
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

module.exports = { step1Swarm };
