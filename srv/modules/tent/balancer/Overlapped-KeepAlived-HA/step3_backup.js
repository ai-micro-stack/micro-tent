require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step3Backup(confObj) {
  const hci_id = confObj.hci_id;
  const hci_name = confObj.hci_name;
  const virtual_router_id = 50 + hci_id;
  const vrrp_instance = "VI_" + hci_id;
  const protocol = confObj.balancer.protocol ?? "TCP";
  const port = confObj.balancer.port ?? "80"; // empty for all ports

  const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;
  const members = confObj.balancer.members;
  const balancer = confObj.balancer;
  const masterNode = members[0];

  if (!(members.length && masterNode)) return;

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const BackupConf = `vrrp_instance ${vrrp_instance} {
    state BACKUP 
    interface $interface 
    virtual_router_id ${virtual_router_id} 
    priority 119
    advert_int 1 
    authentication { 
      #auth_type PASS
      auth_type AH
      auth_pass \"${balancer.peerPass}\" 
    } 
    virtual_ipaddress { 
      $virtualIp/$cidr 
    } 
  }
  `;

  let keepAlivedConf = "";
  keepAlivedConf += BackupConf.replaceAll("$interface", balancer.interface)
    .replaceAll("$peerPass", balancer.peerPass)
    .replaceAll("$virtualIp", balancer.virtualIp.split("/")[0])
    .replaceAll("$cidr", balancer.virtualIp.split("/")[1] ?? "24");

  keepAlivedConf = keepAlivedConf.replace(/\n/g, "\\n");
  // console.log(keepAlivedConf);

  const cmds_all = [
    `echo -e "$keepAlivedConf" > ~/keepalived.conf`,
    `echo $sudopw | sudo -S mv -f ~/keepalived.conf /etc/keepalived/keepalived.conf`,
    "echo $sudopw | sudo -S systemctl start keepalived",
    "echo $sudopw | sudo -S systemctl enable keepalived",
  ];

  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let i = 0; i < members.length; i++) {
    let backupNode = members[i];
    if (backupNode === masterNode) continue;
    console.log("###############################################");
    console.log("## ssh2 session with: " + backupNode);
    console.log("###############################################");
    for (let j = 0; j < cmds.length; j++) {
      cmd = cmds[j]
        .replaceAll("$nodeip", backupNode)
        .replaceAll("$masterNode", masterNode)
        .replaceAll("$user", user.username)
        .replaceAll("$sudopw", user.password)
        .replaceAll("$keepAlivedConf", keepAlivedConf)
        .replaceAll("$linkup", linkup)
        .replaceAll("$interface", balancer.interface)
        .replaceAll("$peerPass", balancer.peerPass)
        .replaceAll("$virtualIp", balancer.virtualIp.split("/")[0]);
      console.log("### COMMAND: " + cmd);
      linkup = await ssh2Promise(
        cmd,
        backupNode, //peer
        user.username,
        user.password
      );
      console.log("### COMPLETE: " + linkup);
      console.log();
    }
  }
}

module.exports = { step3Backup };
