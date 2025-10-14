require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");
const { ssh2Stream } = require("@utils/taskSsh2Stream");

function sleep(S) {
  return new Promise((resolve) => setTimeout(resolve, 1000 * S));
}

async function step2Member(confObj) {
  const hosts = confObj.resource.hosts;
  const members = confObj.storage.members;
  // const clients = confObj.storage.clients;
  // const target = confObj.storage.global_share;
  const user = confObj.serviceAccount;

  if (!members.length) return;

  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";
  let peer = "";
  let host = "";
  let size = members.length.toString();

  // Configure the trusted pool among members
  const peerProbe = "echo $sudopw | sudo -S gluster peer probe $peer";
  // for (let idx in members) {
  //   node = members[idx];
  node = members[0];
  for (let idy in members) {
    peer = members[idy];
    if (node === peer) continue;
    /* use hostname instead of ip to keep consistency. it works just using peer ip */
    host = hosts.find((h) => h.ip === peer).host;
    cmd = peerProbe
      .replaceAll("$sudopw", user.password)
      .replaceAll("$peer", host);
    console.log("###############################################");
    console.log("## ssh2 promise with: " + node + " to " + peer);
    console.log("###############################################");
    console.log(cmd);
    linkup = await ssh2Promise(cmd, node, user.username, user.password);
    console.log(linkup);
    console.log();
  }
  // }

  console.log("sleep 10");
  await sleep(10);

  // Create local storage for gluster volume over all members
  const comand = "echo $sudopw | sudo -S mkdir -p /gluster/brick1/gv0";
  for (let idx in members) {
    node = members[idx];
    cmd = comand.replaceAll("$sudopw", user.password);
    console.log("###############################################");
    console.log("## ssh2 promise with: " + node);
    console.log("###############################################");
    console.log(cmd);
    linkup = await ssh2Promise(cmd, node, user.username, user.password);
    console.log(cmd);
    console.log(linkup);
    console.log();
  }

  console.log("sleep 5");
  await sleep(5);

  // Create gluster volume over all members
  const cmds_gv0 = [
    `echo $sudopw | sudo -S gluster volume stop gv0 -y`,
    `echo $sudopw | sudo -S gluster volume delete gv0 -y `,
    `sleep 5`,
    `echo $sudopw | sudo -S gluster volume create gv0 replica $size $optlist2 force`,
    `echo $sudopw | sudo -S gluster volume start gv0`,
  ];

  cmds = cmds_gv0
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  const optlist2 = members
    .map((n) => {
      return `${n}:/gluster/brick1/gv0`;
    })
    .join(" ");

  for (let idx in members) {
    node = members[idx];

    console.log("###############################################");
    console.log("## ssh2 promise with: " + node);
    console.log("###############################################");
    for (idx in cmds) {
      cmd = cmds[idx]
        .replaceAll("$sudopw", user.password)
        .replaceAll("$linkup", linkup)
        .replaceAll("$size", size)
        .replaceAll("$optlist2", optlist2);
      console.log(cmd);
      linkup = await ssh2Promise(cmd, node, user.username, user.password);
      console.log(linkup);
    }
    console.log();
  }

  // Mount gluster target volume over all storage peer-clients
  const clients = confObj.storage.clients.filter((c) => members.includes(c));
  const target = confObj.storage.global_share;

  const cmds_vol = [
    `sudo su`,
    `mkdir -p ${target}`,
    `mount -t glusterfs localhost:/gv0 ${target}`,
    `sed -i "/^localhost:\\/gv0/d" /etc/fstab`,
    `echo 'localhost:/gv0 /mnt glusterfs defaults,_netdev,backupvolfile-server=localhost 0 0' >> /etc/fstab`,
    // `chown -R root:docker ${target}`,
  ];

  cmds = cmds_vol
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let idx in clients) {
    node = clients[idx];
    console.log("###############################################");
    console.log("## ssh2 stream with: " + node);
    console.log("###############################################");
    linkup = await ssh2Stream(cmds, node, user.username, user.password);
    console.log(linkup);
    console.log();
  }
}

module.exports = { step2Member };
