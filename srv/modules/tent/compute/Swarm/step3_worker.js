require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step3Worker(confObj) {
  const user = confObj.serviceAccount;
  const managers = confObj.compute.managers;
  const workers = confObj.compute.workers;
  // .filter((n) => !managers.includes(n));
  const manager1ip = managers[0];

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const cmds_all = [
    `# Create Keepalived config as BACKUP`,
    `echo $sudopw | sudo -S docker swarm leave --force`,
    `echo $sudopw | sudo -S docker swarm join --token $workerToken $manager1ip`,
  ];

  console.log("###############################################");
  console.log("## ssh2 session with: " + manager1ip);
  console.log("###############################################");
  cmd =
    `echo $sudopw | sudo -S docker swarm join-token worker | sed -n 3p | grep -Po 'docker swarm join --token \\K[^\\s]*'`
      .replaceAll("$sudopw", user.password)
      .replaceAll("$linkup", linkup)
      .replaceAll("$manager1ip", manager1ip);
  console.log("### COMMAND: " + cmd);
  linkup = await ssh2Promise(cmd, manager1ip, user.username, user.password);
  console.log("### COMPLETE: " + linkup);
  console.log();

  const workerToken = linkup.replaceAll("\n", "");

  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let i = 0; i < workers.length; i++) {
    let node = workers[i];
    if (managers.includes(node)) continue;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds.length; j++) {
      cmd = cmds[j]
        .replaceAll("$nodeip", node)
        .replaceAll("$manager1ip", manager1ip)
        .replaceAll("$workerToken", workerToken)
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

module.exports = { step3Worker };
