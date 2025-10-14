require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

async function step0Brick(confObj) {
  const members = confObj.storage.members;
  const user = confObj.serviceAccount;

  if (!members.length) return;

  let node = "";
  let cmds = [];
  // let cmd = "";
  let linkup = "";
  // let result = "";

  switch (confObj.storage.local_type) {
    case 0:
      cmds = [
        `sudo su`,
        `mkfs.xfs -f -i size=512 ${confObj.storage.local}`,
        `mkdir -p /gluster/brick1`,
        `sed -i "/\\/gluster\\/brick1/d" /etc/fstab`,
        `echo '${confObj.storage.local} /gluster/brick1 xfs defaults 1 2' >> /etc/fstab`,
        `mount -a && mount`,
      ];
      break;
    case 1:
      cmds = [
        `sudo su`,
        `mkfs.xfs -f -i size=512 ${confObj.storage.local}`,
        `mkdir -p /gluster/brick1`,
        `mount -o loop ${confObj.storage.local} /gluster/brick1`,
      ];
      break;
    case 3:
    default:
      cmds = [`sudo su`, `ln -s ${confObj.storage.local} /gluster/brick1`];
      break;
  }

  for (let idx in members) {
    node = members[idx];
    console.log("###############################################");
    console.log("## ssh2 stream with: " + node);
    console.log("###############################################");
    linkup = await ssh2Stream(cmds, node, user.username, user.password);
    console.log(linkup);
    console.log();
  }
}

module.exports = { step0Brick };
