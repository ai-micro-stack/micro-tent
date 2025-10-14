require("module-alias/register");
const { ssh2Stream } = require("@utils/taskSsh2Stream");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step5Client(confObj) {
  // if (!confObj.compute.type.toLowerCase().contains("kubernetes")) return;
  const user = confObj.serviceAccount;
  const clients = confObj.storage.clients;
  const target = confObj.storage.global_share;
  const members = confObj.storage.members;
  const member1st = members[0];
  const port = "6789";

  if (!members.length) return;

  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  // Create distributed Ceph filesystem
  const cmds_cephfs = [
    `sudo su`,
    `ceph osd pool create cephfs_meta`,
    `ceph osd pool create cephfs_data`,
    `sleep 10`,
    `ceph fs new cephFs_share cephfs_meta cephfs_data`,
    `ceph fs ls`,
  ];
  cmds = cmds_cephfs
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  console.log("###############################################");
  console.log("## ssh2 stream with: " + member1st);
  console.log("###############################################");
  linkup = await ssh2Stream(cmds, member1st, user.username, user.password);
  console.log(linkup);
  console.log();

  // Mount ceph target volume over all storage clients
  // const mtDevice = `127.0.0.1:${port}`;
  const mtDevice = members.join(`:${port},`) + `:${port}`;
  const cmd_token = "echo $sudopw | sudo -S ceph auth get-key client.admin";
  console.log("###############################################");
  console.log("## ssh2 Promise with: " + member1st);
  console.log("###############################################");
  cmd = cmd_token.replaceAll("$sudopw", user.password);
  console.log("### COMMAND: " + cmd);
  const mtToken = await ssh2Promise(
    cmd,
    member1st,
    user.username,
    user.password
  );
  console.log("### TOKEN: " + mtToken);
  console.log();

  const cmds_4m_client = [
    // for member clients
    `sudo su`,
    `apt install ceph-common -y`,
    `sleep 5`,
    `unlink /etc/ceph/ceph.keyring`,
    `unlink /etc/ceph/ceph.conf`,
    `ln -s /var/snap/microceph/current/conf/ceph.keyring /etc/ceph/ceph.keyring`,
    `ln -s /var/snap/microceph/current/conf/ceph.conf /etc/ceph/ceph.conf`,
    `mkdir -p ${target}`,
    `mount -t ceph :/ ${target} -o name=admin,fs=cephFs_share`,
    // `sed -i "/127.0.0.1:/d" /etc/fstab`,
    `sed -i "/^${mtDevice}:\\//d" /etc/fstab`,
    `echo '${mtDevice}:/ ${target} ceph name=admin,secret=${mtToken},_netdev,noatime 0 0' >> /etc/fstab`,
    // `chown -R root:docker ${target}`,
  ];
  const cmds_4n_client = [
    // for non-member clients
    `sudo su`,
    `apt install ceph-common -y`,
    `sleep 5`,
    `scp -p ${user.username}@${member1st}:/var/snap/microceph/current/conf/ceph.keyring /etc/ceph/ceph.keyring`,
    `scp -p ${user.username}@${member1st}:/var/snap/microceph/current/conf/ceph.conf /etc/ceph/ceph.conf`,
    `mkdir -p ${target}`,
    `mount -t ceph :/ ${target} -o name=admin,fs=cephFs_share`,
    `sed -i "/^${mtDevice}/d" /etc/fstab`,
    `echo '${mtDevice} ${target} ceph name=admin,secret=${mtToken},_netdev,noatime 0 0' >> /etc/fstab`,
    // `chown -R root:docker ${target}`,
  ];

  for (let idx in clients) {
    node = clients[idx];
    if (members.includes(node)) {
      cmds_client = cmds_4m_client;
    } else {
      // cmds_client = cmds_4n_client;
      continue;
    }
    cmds = cmds_client
      .map((cmd) => {
        return cmd.split("#")[0];
      })
      .filter((cmd) => {
        return cmd.length > 0;
      });
    console.log("###############################################");
    console.log("## ssh2 stream with: " + node);
    console.log("###############################################");
    linkup = await ssh2Stream(cmds, node, user.username, user.password);
    console.log(linkup);
    console.log();
  }
}

module.exports = { step5Client };
