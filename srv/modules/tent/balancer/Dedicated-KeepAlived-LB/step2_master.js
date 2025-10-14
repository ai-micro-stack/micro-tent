require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step2Master(confObj) {
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

  if (!masterNode) return;

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const GlobalConf = `
# Global Config
global_defs {
    lvs_sync_daemon $interface ${vrrp_instance} id ${virtual_router_id}
    router_id ${hci_name}
    enable_script_security
    script_user root
}
`;

  const MasterConf = `
# VRRP instance
vrrp_instance ${vrrp_instance} {
    state MASTER
    interface $interface 
    advert_int 5
    virtual_router_id ${virtual_router_id}
    priority 120
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

  const virtualServerConf = `
# Load balanver
virtual_server $virtualIp $port {
    delay_loop 60
    lb_algo rr
    lb_kind DR
    protocol $protocol
    # persistence_timeout 60  # Uncomment to keep reaching same work node before session timeout

    # Real Server List
    $realServerList

}
`;

  const realServerConf = `
    # Real Server $nodeip
    real_server $nodeip $port {
        weight 100
        TCP_CHECK {
            connect_timeout 6
        }
    }
  `;

  // console.log(nodes);

  let keepAlivedConf = "";
  keepAlivedConf += GlobalConf.replaceAll("$interface", balancer.interface);
  keepAlivedConf += MasterConf.replaceAll("$interface", balancer.interface)
    .replaceAll("$peerPass", balancer.peerPass)
    .replaceAll("$virtualIp", balancer.virtualIp.split("/")[0])
    .replaceAll("$cidr", balancer.virtualIp.split("/")[1] ?? "24");

  const ports = port.split(",");
  for (let p = 0; p < ports.length; p++) {
    let realServerList = "";
    for (let i = 0; i < nodes.length; i++) {
      let realServer = nodes[i];
      realServerList += realServerConf
        .replaceAll("$nodeip", realServer)
        .replaceAll("$port", ports[p]);
    }
    keepAlivedConf += virtualServerConf
      .replaceAll("$realServerList", realServerList)
      .replaceAll("$virtualIp", balancer.virtualIp.split("/")[0])
      .replaceAll("$protocol", protocol)
      .replaceAll("$port", ports[p]);
  }

  keepAlivedConf = keepAlivedConf.replace(/\n/g, "\\n");
  // console.log(keepAlivedConf);

  const cmds_1st = [
    `echo -e "$keepAlivedConf" > ~/keepalived.conf`,
    `echo $sudopw | sudo -S mv -f ~/keepalived.conf /etc/keepalived/keepalived.conf`,
    "echo $sudopw | sudo -S systemctl start keepalived",
    "echo $sudopw | sudo -S systemctl enable keepalived",
  ];

  cmds = cmds_1st
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  console.log("###############################################");
  console.log("## ssh2 session with: " + masterNode);
  console.log("###############################################");
  for (let i = 0; i < cmds.length; i++) {
    cmd = cmds[i]
      .replaceAll("$sudopw", user.password)
      .replaceAll("$linkup", linkup)
      .replaceAll("$masterNode", masterNode)
      // .replaceAll("$interface", balancer.interface)
      // .replaceAll("$peerPass", balancer.peerPass)
      .replaceAll("$keepAlivedConf", keepAlivedConf)
      .replaceAll("$virtualIp", balancer.virtualIp.split("/")[0]);
    console.log("### COMMAND: " + cmd);
    linkup = await ssh2Promise(cmd, masterNode, user.username, user.password);
    console.log("### COMPLETE: " + linkup);
    console.log();
  }
}

module.exports = { step2Master };
