require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step1Gluster(confObj) {
  const nodes = confObj.storage.nodes;
  const members = confObj.storage.members;
  const user = confObj.serviceAccount;

  if (!(members.length && nodes.length)) return;

  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmds_inst = [
    `sudo su`,
    `apt update -y`,
    `apt remove glusterfs-client -y`,
    `apt install software-properties-common glusterfs-server -y`,
    `sleep 10`,
    `systemctl start glusterd`,
    `systemctl enable glusterd`,
  ];

  cmds = cmds_inst
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let idx in members) {
    node = members[idx];
    console.log("###############################################");
    console.log("## ssh2 stream with: " + node);
    console.log("###############################################");
    linkup = await ssh2Stream(cmds, node, user.username, user.password);
    console.log();
  }

  // open wirefall among the storage members
  const cmd_fw =
    "echo $sudopw | sudo -S iptables -I INPUT -p all -s $source -j ACCEPT";
  let source = "";
  for (let idx in members) {
    node = members[idx];
    for (let idy in nodes) {
      source = nodes[idy];
      if (node === source) continue;
      cmd = cmd_fw
        .replaceAll("$sudopw", user.password)
        .replaceAll("$source", source);
      console.log("###############################################");
      console.log("## ssh2 stream with: " + node + " for " + source);
      console.log("###############################################");
      console.log(cmd);
      linkup = await ssh2Promise(cmd, node, user.username, user.password);
      console.log(linkup);
      console.log();
    }
  }
}

module.exports = { step1Gluster };
