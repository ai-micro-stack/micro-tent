require("module-alias/register");
const { ssh2Promise } = require("@utils/taskSsh2Promise");

async function step4Worker(confObj) {
  const hci_id = confObj.hci_id;
  const hci_name = confObj.hci_name;
  const virtual_router_id = 50 + hci_id;
  const vrrp_instance = "VI_" + hci_id;
  const protocol = confObj.balancer.protocol ?? "TCP";
  const port = confObj.balancer.port ?? "80"; // empty for all ports
  // const nodes = confObj.compute.nodes;
  const user = confObj.serviceAccount;
  const members = confObj.balancer.members;
  const balancer = confObj.balancer;
  // const masterNode = members[0];
  const workers = confObj.compute.reqtakers ?? confObj.compute.nodes;
  // .filter((n) => !managers.includes(n));

  if (!(members.length && workers.length)) return;

  // let node = "";
  let cmds = [];
  let cmd = "";
  let linkup = "";
  // let result = "";

  const dummyDevice = `# equivlence command: sudo ip link add dummy0 type dummy
[NetDev]
Name=dummy0
Kind=dummy
`;

  const dummyNetwork = `network:
  version: 2
  renderer: networkd
  ethernets:
    dummy0:
      dhcp4: false
      addresses: 
        - $virtualIp/32
`;

  const dummyArpConfAll = `### KeepAlived_LB Work Node ###
# No vIP binding on non-active nodes
net.ipv4.ip_nonlocal_bind=1

# solve ARP flux problem on all NICs
net.ipv4.conf.dummy0.arp_ignore = 1
net.ipv4.conf.dummy0.arp_announce = 2
`;

  let keepAlivedConf = "";
  keepAlivedConf += dummyNetwork.replaceAll(
    "$virtualIp",
    balancer.virtualIp.split("/")[0]
  );

  keepAlivedConf = keepAlivedConf.replace(/\n/g, "\\n");
  // console.log(keepAlivedConf);

  const cmds_all = [
    /* create a dummy sevice to resond balancer health check */
    `echo $sudopw | sudo -S apt install nginx -y`,

    /* load the kernel dummy module for current session */
    `echo $sudopw | sudo -S modprobe dummy`,
    `echo $sudopw | sudo -S ip link add dummy0 type dummy`,
    // `echo $sudopw | sudo -S ip addr add $virtualIp/32 dev dummy0`,
    // `echo $sudopw | sudo -S ip link set dummy0 up`,

    /* persist dummy module load with modules-load */
    `echo "dummy" | tee ~/dummy.conf`,
    `cat ~/dummy.conf`,
    `echo $sudopw | sudo -S mv -f ~/dummy.conf /etc/modules-load.d/dummy.conf`,
    `echo $sudopw | sudo -S chown root:root /etc/modules-load.d/dummy.conf`,
    `echo $sudopw | sudo -S chmod 644 /etc/modules-load.d/dummy.conf`,

    /* persist dummy device by networkd */
    `echo -e "$dummyDevice" > ~/60-dummy0.netdev`,
    `cat ~/60-dummy0.netdev`,
    `echo $sudopw | sudo -S mv -f ~/60-dummy0.netdev /etc/systemd/network/60-dummy0.netdev`,
    `echo $sudopw | sudo -S chown root:root /etc/systemd/network/60-dummy0.netdev`,
    `echo $sudopw | sudo -S chmod 644 /etc/systemd/network/60-dummy0.netdev`,

    /* persist dummy network by netplan */
    `echo -e "$keepAlivedConf" > ~/60-dummy-nic.yaml`,
    `cat ~/60-dummy-nic.yaml`,
    `echo $sudopw | sudo -S mv -f ~/60-dummy-nic.yaml /etc/netplan/60-dummy-nic.yaml`,
    `echo $sudopw | sudo -S chown root:root /etc/netplan/60-dummy-nic.yaml`,
    `echo $sudopw | sudo -S chmod 600 /etc/netplan/60-dummy-nic.yaml`,
    "echo $sudopw | sudo -S netplan apply",

    /* to avoid the the ARP flux */
    // `echo $sudopw | sudo -S echo 1 > /proc/sys/net/ipv4/conf/all/arp_ignore`,
    // `echo $sudopw | sudo -S echo 1 > /proc/sys/net/ipv4/conf/lo/arp_ignore`,
    // `echo $sudopw | sudo -S echo 2 > /proc/sys/net/ipv4/conf/all/arp_announce`,
    // `echo $sudopw | sudo -S echo 2 > /proc/sys/net/ipv4/conf/lo/arp_announce`,
    `echo $sudopw | sudo -S cat /etc/sysctl.conf > /tmp/sysctl.conf`,
    `echo $sudopw | sudo -S chmod 666 /tmp/sysctl.conf`,
    `sed -i '/### KeepAlived_LB Work Node ###/,$d' /tmp/sysctl.conf`,
    `sed -i '/# No vIP binding on non-active nodes/,$d' /tmp/sysctl.conf`,
    `echo -e "$dummyArpConfAll" >> /tmp/sysctl.conf`,
    `echo $sudopw | sudo -S mv -f /tmp/sysctl.conf /etc/sysctl.conf`,
    `echo $sudopw | sudo -S chown root:root /etc/sysctl.conf`,
    `echo $sudopw | sudo -S chmod 600 /etc/sysctl.conf`,
  ];

  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  for (let i = 0; i < workers.length; i++) {
    let node = workers[i];
    if (members.includes(node)) continue;
    console.log("###############################################");
    console.log("## ssh2 session with: " + node);
    console.log("###############################################");
    for (let j = 0; j < cmds.length; j++) {
      cmd = cmds[j]
        .replaceAll("$nodeip", node)
        .replaceAll("$user", user.username)
        .replaceAll("$sudopw", user.password)
        .replaceAll("$linkup", linkup)
        .replaceAll("$dummyDevice", dummyDevice)
        .replaceAll("$keepAlivedConf", keepAlivedConf)
        .replaceAll("$virtualIp", balancer.virtualIp.split("/")[0]);
      console.log("### COMMAND: " + cmd);
      linkup = await ssh2Promise(cmd, node, user.username, user.password);
      console.log("### COMPLETE: " + linkup);
      console.log();
    }
  }
}

module.exports = { step4Worker };
