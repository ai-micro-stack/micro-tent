const PopulateRackConf = (curInterface, curSubnet, curPxe) => {
  let cfgContent = `
  ###############################
  ##  pxe server settings     ##
  ###############################
  `.replace(/^ +/gm, "");
  let cfgPackages = `
  ###############################
  ##  pxe software packages   ##
  ###############################
  `.replace(/^ +/gm, "");

  try {
    // subnet section
    cfgContent += `dhcpInterface="${curInterface.nic_name}"\n`;
    cfgContent += `dhcpNetAddress="${curSubnet.ip4_netaddress}"\n`;
    cfgContent += `dhcpNetMask="${curSubnet.netmask}"\n`;
    cfgContent += `dhcpStart="${curSubnet.ip4_begin}"\n`;
    cfgContent += `dhcpEnd="${curSubnet.ip4_end}"\n`;
    cfgContent += `dhcpRouter="${curSubnet.ip4_router}"\n`;
    cfgContent += `dhcpDnsList="${curSubnet.ip4_dnslist}"\n`;
    cfgContent += `dhcpDomain="${curSubnet.ip4_dnsdomain}"\n`;
    cfgContent += `dhcpNextServer="${curSubnet.address}"\n`;
    cfgContent += `dhcpServer="${curSubnet.address}"\n`;
    cfgContent += `pxeRoot="${curPxe.pxeRoot}"\n`;
    cfgContent += `imgRoot="${curPxe.imgRoot}"\n`;
    cfgContent += `pxeAuto="${curPxe.pxeAuto}"\n`;

    // package section
    cfgPackages += `TFTP_SERVER="${curPxe.TFTP_SERVER}"\n`;
    cfgPackages += `HTTP_SERVER="${curPxe.HTTP_SERVER}"\n`;
    cfgPackages += `NFS_SERVER="${curPxe.NFS_SERVER}"\n`;
    cfgPackages += `iSCSI_SERVER="${curPxe.iSCSI_SERVER}"\n`;
    cfgPackages += `SMB_SERVER="${curPxe.SMB_SERVER}"\n`;
    cfgPackages += `DHCP_PROXY="${curPxe.DHCP_PROXY}"\n`;
    cfgPackages += `DHCP_SERVER="${curPxe.DHCP_SERVER}"\n`;
    cfgPackages += `DNS_SERVER="${curPxe.DNS_SERVER}"\n`;
    cfgPackages += `NTP_SERVER="${curPxe.NTP_SERVER}"\n`;
    cfgPackages += `ISO_UTILS="${curPxe.ISO_UTILS}"\n`;

    // assemble section
    cfgContent += `${cfgPackages}`;
    return { code: 0, data: cfgContent };
  } catch (err) {
    return { code: -1, data: err };
  }
};

module.exports = { PopulateRackConf };
