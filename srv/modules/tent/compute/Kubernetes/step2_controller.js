require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step2Controller(confObj) {
  // const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;
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

  const cmds_all = [
    `echo $sudopw | sudo -S $managerToken`,
    // `sleep 90`,
    // `echo $sudopw | sudo -S microk8s kubectl get nodes`,
    `sleep 20`,
  ];

  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let i = 0; i < managers.length; i++) {
    node = managers[i].ip;
    if (node === manager1ip) continue;

    console.log("###############################################");
    console.log("## ssh2 session with: " + manager1ip);
    console.log("###############################################");
    cmd =
      `echo $sudopw | sudo -S microk8s add-node | grep 'microk8s join' | head -n 1`
        .replaceAll("$sudopw", user.password)
        .replaceAll("$linkup", linkup)
        .replaceAll("$manager1ip", manager1ip);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, manager1ip, user.username, user.password);
    console.log("### COMPLETE: " + linkup);
    console.log();

    const managerToken = linkup.replaceAll("\n", "");

    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds.length; j++) {
      cmd = cmds[j]
        .replaceAll("$nodeip", node)
        .replaceAll("$managerToken", managerToken)
        .replaceAll("--worker", "")
        .replaceAll("$user", user.username)
        .replaceAll("$sudopw", user.password)
        .replaceAll("$linkup", linkup);
      console.log("### COMMAND: " + cmd);
      linkup = await ssh2Promise(cmd, node, user.username, user.password);
      console.log("### COMPLETE: " + linkup);
      console.log();
    }
  }

  const cmds_chk = [
    `echo $sudopw | sudo -S microk8s kubectl get nodes`,
    `echo $sudopw | sudo -S microk8s kubectl get services`,
    `echo $sudopw | sudo -S microk8s kubectl get all --all-namespaces`,
  ];

  cmds = cmds_chk
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

module.exports = { step2Controller };
