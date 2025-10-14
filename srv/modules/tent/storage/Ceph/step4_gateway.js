require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step4Gateway(confObj) {
  const user = confObj.serviceAccount;
  const members = confObj.storage.members;
  const member1st = members[0];
  const diskList = confObj.storage.local;

  if (!members.length) return;

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmds_1st = [
    "echo $sudopw | sudo -S microceph enable rgw",
    "echo $sudopw | sudo -S microceph status",
  ];

  cmds = cmds_1st
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  console.log("###############################################");
  console.log("## ssh2 Promise with: " + member1st);
  console.log("###############################################");
  for (let i = 0; i < cmds.length; i++) {
    cmd = cmds[i]
      .replaceAll("$sudopw", user.password)
      .replaceAll("$linkup", linkup)
      .replaceAll("$member1st", member1st);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, member1st, user.username, user.password);
    console.log("### COMPLETE: " + linkup);
  }
  console.log();
}

module.exports = { step4Gateway };
