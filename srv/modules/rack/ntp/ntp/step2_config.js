require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function step2Config(confObj) {
  const user = confObj.serviceAccount;
  const nodes = ["127.0.0.1"];

  const cmds_all = [
    `sudo su`,
    `systemctl start ntp`,
    `systemctl enable ntp`,
    // `exit`,
    // `exit`,
  ];

  let cmds = [];
  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  let node = "";
  for (let idx in nodes) {
    node = nodes[idx];
    console.log("###############################################");
    console.log("## shell stream with: " + node);
    console.log("###############################################");
    result = await ssh2Stream(cmds, node, user.username, user.password);
    console.log();
  }
}

module.exports = { step2Config };
