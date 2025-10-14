require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

function sleep(S) {
  return new Promise((resolve) => setTimeout(resolve, 1000 * S));
}

async function step2Member(confObj) {
  const hosts = confObj.resource.hosts;
  const user = confObj.serviceAccount;
  const members = confObj.storage.members;
  const member1st = members[0];

  if (!members.length) return;

  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  let result = "";

  // Initialize the ceph cluster
  const cmds_1st = ["echo $sudopw | sudo -S microceph cluster bootstrap"];

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
    console.log();
  }

  console.log("sleep 10");
  sleep(10);

  // Join other Ceph cluster members & add disks
  const cmd_add = "echo $sudopw | sudo -S microceph cluster add $host";
  const cmds_join = [
    `echo $sudopw | sudo -S microceph cluster join $cephToken`,
  ];

  let host = {};
  for (let idx in members) {
    node = members[idx];
    if (node === member1st) continue;
    host = hosts.find((h) => h.ip === node).host;
    console.log("###############################################");
    console.log("## ssh2 Promise with: " + member1st);
    console.log("###############################################");
    cmd = cmd_add
      .replaceAll("$sudopw", user.password)
      .replaceAll("$host", host);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, member1st, user.username, user.password);
    console.log("### TOKEN: " + linkup);
    console.log();

    console.log("###############################################");
    console.log("## ssh2 Promise with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds_join.length; j++) {
      cmd = cmds_join[j]
        .replaceAll("$sudopw", user.password)
        .replaceAll("$cephToken", linkup);
      console.log("### COMMAND: " + cmd);
      result = await ssh2Promise(cmd, node, user.username, user.password);
      console.log();
    }
  }
}

module.exports = { step2Member };
