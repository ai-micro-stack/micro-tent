const ipClassInd = { A: "10", B: "172", C: "192" };
const localComputeTypes = ["(CPU Only)", "Nvidia GPU", "AMD GPU"];
const localStorageTypes = ["Hard Disk", "Image File", "Local Folder"];

const defaultCluster = {
  cluster_name: "-- available hosts --",
  cluster_note: "_@_",
};

const defaultPlat = {
  plat_name: "-- all free clusters --",
  plat_note: "_@_",
};

const pluginModuleTypes = {
  rackPlugin: ["pxe", "dhcp", "proxy", "tftp", "http", "nfs", "dns", "ntp"],
  tentPlugin: ["storage", "compute", "balancer", "dashboard"],
  platPlugin: ["embedding", "vectordb", "llm"],
};

const rackService = {
  pxe: {
    service: "BOOT_LOADER (*)",
    protocol: "(n/a)",
    port: "(n/a)",
    provider: "ipxe",
  },
  dhcp: {
    service: "DHCP_SERVER (*)",
    protocol: "UDP",
    port: "67",
    provider: "dnsmasq",
  },
  proxy: {
    service: "DHCP_PROXY (.)",
    protocol: "UDP",
    port: "67",
    provider: "dnsmasq",
  },
  tftp: {
    service: "TFTP_SERVER (*)",
    protocol: "UDP",
    port: "69",
    provider: "dnsmasq",
  },
  http: {
    service: "HTTP_SERVER (*)",
    protocol: "TCP",
    port: "80",
    provider: "nginx",
  },
  nfs: {
    service: "NFS_SERVER",
    protocol: "TCP",
    port: "2049",
    provider: "nfs-kernel-server",
  },
  // iscsi: {
  //   service: "iSCSI_SERVER",
  //   protocol: "TCP",
  //   port: "3260",
  //   provider: "(not installed)",
  // },
  // smb: {
  //   service: "SMB_SERVER",
  //   protocol: "TCP",
  //   port: "445",
  //   provider: "(not installed)",
  // },
  dns: {
    service: "DNS_SERVER",
    protocol: "TCP",
    port: "53",
    provider: "dnsmasq",
  },
  ntp: {
    service: "NTP_SERVER",
    protocol: "UDP",
    port: "123",
    provider: "ntp",
  },
};

module.exports = {
  ipClassInd,
  localComputeTypes,
  localStorageTypes,
  defaultCluster,
  defaultPlat,
  pluginModuleTypes,
  rackService,
};
