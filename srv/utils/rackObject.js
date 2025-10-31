// const path = require("path");
// const { pluginModuleTypes } = require("@consts/constant");

const dotenv = require("dotenv");
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { SERVICE_USER, SERVICE_PASS, SERVICE_CERT } = process.env;

// const stack = "rack";
// const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
// const moduleDatabase = path.join(
//   __dirname,
//   `../modules/${stack}`,
//   `module.mdb`
// );
// // const curTentModule = StackModules(stack, moduleTypes, moduleDatabase);

const PopulateRackObject = (curInterface, curSubnet, curPxe) => {
  const confObject = {
    interface_name: curInterface.nic_name,
    interface_mac: curInterface.nic_mac,
    interface_ipv4: curSubnet.cidr,
    pxe_subnet: {},
    pxe_environment: {},
    pxe: {},
    dhcp: {},
    proxy: {},
    tftp: {},
    http: {},
    nfs: {},
    dns: {},
    ntp: {},
    iscsi: {},
    smb: {},
    pxe_dependency: [],
    serviceAccount: {},
  };
  // rackPlugin: ["pxe", "dhcp", "tftp", "http", "nfs", "dns", "ntp"],
  try {
    confObject.pxe_subnet.dhcpNetAddress = curSubnet.ip4_netaddress;
    confObject.pxe_subnet.dhcpNetMask = curSubnet.netmask;
    confObject.pxe_subnet.dhcpStart = curSubnet.ip4_begin;
    confObject.pxe_subnet.dhcpEnd = curSubnet.ip4_end;
    confObject.pxe_subnet.dhcpRouter = curSubnet.ip4_router;
    confObject.pxe_subnet.dhcpDnsList = curSubnet.ip4_dnslist;
    confObject.pxe_subnet.dhcpDomain = curSubnet.ip4_dnsdomain;
    confObject.pxe_subnet.dhcpNextServer = curSubnet.address;
    confObject.pxe_subnet.dhcpServer = curSubnet.address;

    confObject.pxe_environment.pxeRoot = curPxe.pxeRoot;
    confObject.pxe_environment.imgRoot = curPxe.imgRoot;
    confObject.pxe_environment.pxeAuto = curPxe.pxeAuto;

    confObject.pxe.type = curPxe.pxe_type;
    confObject.dhcp.type = curPxe.DHCP_SERVER;
    confObject.proxy.type = curPxe.DHCP_PROXY;
    confObject.tftp.type = curPxe.TFTP_SERVER;
    confObject.http.type = curPxe.HTTP_SERVER;
    confObject.nfs.type = curPxe.NFS_SERVER;
    confObject.dns.type = curPxe.DNS_SERVER;
    confObject.ntp.type = curPxe.NTP_SERVER;
    confObject.iscsi.type = curPxe.iSCSI_SERVER;
    confObject.smb.type = curPxe.SMB_SERVER;

    confObject.pxe_dependency = curPxe.ISO_UTILS.split(" ");

    confObject.serviceAccount.username = `${SERVICE_USER}`;
    confObject.serviceAccount.password = `${SERVICE_PASS}`;
    confObject.serviceAccount.certname = `${SERVICE_CERT}`;

    return { code: 0, data: confObject };
  } catch (err) {
    return { code: -1, data: err };
  }
};

module.exports = { PopulateRackObject };
