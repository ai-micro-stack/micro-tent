require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step2Manager(confObj) {
  // const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;
  const workers = confObj.compute.workers;
  const managers = confObj.compute.managers.map((manager) => {
    return { ip: manager, availability: workers.includes(manager) };
  });
  const manager1ip = managers[0].ip;

  let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmds_1st = [
    `echo $sudopw | sudo -S docker swarm leave --force`,
    `echo $sudopw | sudo -S docker swarm init --advertise-addr $manager1ip`,
    `echo $sudopw | sudo -S docker swarm join-token manager | sed -n 3p | grep -Po 'docker swarm join --token \\K[^\\s]*' $availability`,
  ];

  const cmds_all = [
    `# Create Keepalived config as BACKUP`,
    `echo $sudopw | sudo -S docker swarm leave --force`,
    `echo $sudopw | sudo -S docker swarm join --token $managerToken $manager1ip`,
  ];

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

  const managerToken = linkup.replaceAll("\n", "");

  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let i = 0; i < managers.length; i++) {
    node = managers[i].ip;
    let availability = managers[i].availability ? "" : " --availability=drain";
    if (node === manager1ip) continue;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds.length; j++) {
      cmd = cmds[j]
        .replaceAll("$nodeip", node)
        .replaceAll("$manager1ip", manager1ip)
        .replaceAll("$managerToken", managerToken)
        .replaceAll("$availability", availability)
        .replaceAll("$user", user.username)
        .replaceAll("$sudopw", user.password)
        .replaceAll("$linkup", linkup);
      console.log("### COMMAND: " + cmd);
      linkup = await ssh2Promise(cmd, node, user.username, user.password);
      console.log("### COMPLETE: " + linkup);
      console.log();
    }
  }
}

module.exports = { step2Manager };
