require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step0Member(confObj, area) {
  const members = confObj[area].nodes;
  const user = confObj.serviceAccount;

  let node = "";
  // let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  // adjust cluster member permission for portainer access
  const comand = "echo $sudopw | sudo -S chmod 666 /var/run/docker.sock";
  node = "";
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
}

module.exports = { step0Member };
