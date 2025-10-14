require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

// Mount gluster target volume over all storage non-member-clients
async function step3Client(confObj) {
  const members = confObj.storage.members;
  const clients = confObj.storage.clients.filter((c) => !members.includes(c));
  const target = confObj.storage.global_share;
  const user = confObj.serviceAccount;

  if (!members.length) return;

  let node = "";
  let cmds = [];
  // let cmd = "";
  let linkup = "";
  // let result = "";
  let provider = "";

  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min); // Ensure min is an integer, rounding up if necessary
    max = Math.floor(max); // Ensure max is an integer, rounding down if necessary
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const cmds_client = [
    `sudo su`,
    `apt update -y`,
    `apt remove software-properties-common glusterfs-server -y`,
    `apt install glusterfs-client -y`,
    `sleep 5`,
    `mkdir -p ${target}`,
    `mount -t glusterfs \$provider:/gv0 ${target}`,
    `sed -i "/:\\/gv0 \\/mnt glusterfs/d" /etc/fstab`,
    `echo '\$provider:/gv0 /mnt glusterfs defaults,_netdev,backupvolfile-server=\$provider 0 0' >> /etc/fstab`,
    // `chown -R root:docker ${target}`,
  ];

  cmds = cmds_client
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let idx in clients) {
    node = clients[idx];
    provider = members[getRandomIntInclusive(0, members.length - 1)];
    console.log("###############################################");
    console.log("## ssh2 stream with: " + node);
    console.log("###############################################");
    linkup = await ssh2Stream(
      cmds.map((c) => c.replaceAll("$provider", `${provider}`)),
      node,
      user.username,
      user.password
    );
    console.log(linkup);
    console.log();
  }
}

module.exports = { step3Client };
