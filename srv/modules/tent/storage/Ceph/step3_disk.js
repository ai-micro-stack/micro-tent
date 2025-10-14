require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step3Disk(confObj) {
  const user = confObj.serviceAccount;
  const members = confObj.storage.members;
  const member1st = members[0];
  const diskList = confObj.storage.local;
  const diskPaths = diskList.split(",").join(" ");

  if (!members.length) return;

  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmd_disk = `echo $sudopw | sudo -S microceph disk add $diskPaths --wipe`;
  const cmds_1st = [
    "echo $sudopw | sudo -S microceph status",
    "echo $sudopw | sudo -S ceph osd status",
  ];

  cmds = cmds_1st
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let idx in members) {
    node = members[idx];
    console.log("###############################################");
    console.log("## ssh2 Promise with: " + node);
    console.log("###############################################");
    cmd = cmd_disk
      .replaceAll("$sudopw", user.password)
      .replaceAll("$diskPaths", diskPaths);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, node, user.username, user.password);
    console.log();
  }

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

module.exports = { step3Disk };
