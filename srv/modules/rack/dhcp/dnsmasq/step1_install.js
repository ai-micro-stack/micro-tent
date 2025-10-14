require("module-alias/register");
// const { ssh2Stream } = require("@utils/taskSsh2Stream");
const { shellStream } = require("@utils/taskShellStream");

async function step1Install(confObj) {
  const user = confObj.serviceAccount;
  const nodes = ["127.0.0.1"];

  let node = "";
  let cmds = [];
  let result = "";

  const cmds_inst = [
    `sudo su`,
    // `apt update -y`,
    `apt install dnsmasq -y`,
    `exit`,
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
    // result = await ssh2Stream(cmds, node, user.username, user.password);
    result = await shellStream(cmds);
    console.log();
  }
}

module.exports = { step1Install };
