require("module-alias/register");
const fs = require("fs");
const path = require("path");
// // const { ssh2Stream } = require("@utils/taskSsh2Stream");
const { shellStream } = require("@utils/taskShellStream");
const { replaceContentBetweenTags } = require("@utils/stringReplaceSeg");

async function step2Config(confObj, sections, replacements) {
  const user = confObj.serviceAccount;
  const nodes = ["127.0.0.1"];

  const dhcpInterface = confObj.interface_name;
  const pxeRoot = confObj.pxe_environment.pxeRoot;
  const dhcpNextServer = confObj.pxe_subnet.dhcpNextServer;
  const dhcpNetAddress = confObj.pxe_subnet.dhcpNetAddress;
  const dhcpNetMask = confObj.pxe_subnet.dhcpNetMask;
  const dhcpStart = confObj.pxe_subnet.dhcpStart;
  const dhcpEnd = confObj.pxe_subnet.dhcpEnd;
  const dhcpRouter = confObj.pxe_subnet.dhcpRouter;
  const dhcpDnsList = confObj.pxe_subnet.dhcpDnsList;
  const dhcpDomain = confObj.pxe_subnet.dhcpDomain;

  // const sourcePath = "/etc/dnsmasq.conf";
  const sourcePath = path.join(__dirname, `./dnsmasq.conf.temp`);
  const targetPath = "/tmp/dnsmasq.conf";

  let targetData = "";
  let sourceData;
  try {
    sourceData = fs.readFileSync(targetPath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      try {
        sourceData = fs.readFileSync(sourcePath, "utf8");
      } catch (secondErr) {
        sourceData = fs.readFileSync("/etc/dnsmasq.conf", "utf8");
      }
    } else {
      sourceData = null;
    }
  }

  for (i = 0; i < sections.length; i++) {
    let section = sections[i];
    let replacement = replacements[i]
      .replaceAll("$dhcpInterface", dhcpInterface)
      .replaceAll("$pxeRoot", pxeRoot)
      .replaceAll("$dhcpNextServer", dhcpNextServer)
      .replaceAll("$dhcpNetAddress", dhcpNetAddress)
      .replaceAll("$dhcpNetMask", dhcpNetMask)
      .replaceAll("$dhcpStart", dhcpStart)
      .replaceAll("$dhcpEnd", dhcpEnd)
      .replaceAll("$dhcpRouter", dhcpRouter)
      .replaceAll("$dhcpDnsList", dhcpDnsList)
      .replaceAll("$dhcpDomain", dhcpDomain);
    sourceData = i ? targetData : sourceData;
    const tagStart = `### PXE.${section.toUpperCase()}_CONF_BEGIN ###`;
    const tagStop = `### PXE.${section.toUpperCase()}_CONF_END ###`;
    targetData = replaceContentBetweenTags(
      sourceData,
      tagStart,
      tagStop,
      replacement
    );
  }

  fs.writeFileSync(targetPath, targetData, "utf8");

  const cmds_all = [
    `sudo su`,
    `systemctl stop dnsmasq`,
    `rm -f /etc/dnsmasq.conf`,
    `yes | cp -rf /tmp/dnsmasq.conf /etc/dnsmasq.conf`,
    `rm -f /var/lib/misc/dnsmasq.leases`,
    `systemctl start dnsmasq`,
    `exit`,
  ];

  let cmds = [];
  cmds = cmds_all
    .map((cmd) => {
      return cmd.split("#")[0];
    })
    .filter((cmd) => {
      return cmd.length > 0;
    });

  let node = "";
  for (let idx in nodes) {
    node = nodes[idx];
    console.log("###############################################");
    console.log("## shell stream with:: " + node);
    console.log("###############################################");
    // // result = await ssh2Stream(cmds, node, user.username, user.password);
    result = await shellStream(cmds);
    console.log();
  }
}

module.exports = { step2Config };
