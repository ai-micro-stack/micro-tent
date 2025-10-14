require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step4Storage(confObj) {
  if (!confObj.storage.type.toLowerCase().includes("ceph")) return;

  // will use the cephfs as the RWX storage as we have created in ceph cluster
  const cmds_all = [`echo $sudopw | sudo -S modprobe rbd`];
  const cmds_1st = [
    `echo $sudopw | sudo -S microk8s enable rook-ceph`,
    `sleep 60`,
    `echo $sudopw | sudo -S ceph fs volume create microk8s-cephfs0`,
    `echo $sudopw | sudo -S microk8s connect-external-ceph`,
  ];

  // const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;
  const nodes = confObj.compute.nodes;
  const workers = confObj.original["Worker"];
  const managers = confObj.original["Control-Plane"].map((manager) => {
    return { ip: manager, availability: workers.includes(manager) };
  });
  const manager1ip = managers[0].ip;
  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];
    if (!managers.includes(node) && !workers.includes(node)) continue;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds_all.length; j++) {
      cmd = cmds_all[j]
        .replaceAll("$nodeip", node)
        .replaceAll("$user", user.username)
        .replaceAll("$sudopw", user.password)
        .replaceAll("$linkup", linkup);
      console.log("### COMMAND: " + cmd);
      linkup = await ssh2Promise(cmd, node, user.username, user.password);
      console.log("### COMPLETE: " + linkup);
      console.log();
    }
  }

  cmd = "";
  linkup = "";

  cmds = cmds_1st
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  console.log("###############################################");
  console.log("## ssh2 session with: " + manager1ip);
  console.log("###############################################");
  for (let i = 0; i < cmds.length; i++) {
    cmd = cmds[i]
      .replaceAll("$sudopw", user.password)
      .replaceAll("$linkup", linkup)
      .replaceAll("$manager1ip", manager1ip);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, manager1ip, user.username, user.password);
    console.log("### COMPLETE: " + linkup);
    console.log();
  }
}

module.exports = { step4Storage };
