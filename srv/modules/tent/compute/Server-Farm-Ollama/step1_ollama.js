require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function step1Ollma(confObj) {
  const nodes = confObj.compute.nodes;
  const spares = confObj.compute.spares ?? [];
  const user = confObj.serviceAccount;

  if (!nodes.length) return;

  let node = "";
  let cmds = [];
  // let cmd = "";
  // let linkup = "";
  let result = "";

  const cmds_inst = [
    `sudo su`,
    `iptables -F`,
    `iptables -P INPUT ACCEPT`,
    `apt update -y`,
    `apt install curl -y`,
    `curl -fsSL https://ollama.com/install.sh | sh`,
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
    if (spares.includes(node)) return;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    result = await ssh2Stream(cmds, node, user.username, user.password);
    console.log();
  }
}

module.exports = { step1Ollma };
