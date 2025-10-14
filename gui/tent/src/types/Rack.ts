import type { moduleType } from "@/types/Addon";
import { defaultRoles } from "@/types/Addon";

export type PxeType = {
  subnet_id: number;
  pxe_type: string;
  pxeRoot: string;
  imgRoot: string;
  pxeAuto: string;
  TFTP_SERVER: string;
  HTTP_SERVER: string;
  NFS_SERVER: string;
  iSCSI_SERVER: string;
  SMB_SERVER: string;
  DHCP_PROXY: string;
  DHCP_SERVER: string;
  DNS_SERVER: string;
  NTP_SERVER: string;
  ISO_UTILS: string;
  is_active: boolean;
};

export const emptyPxe: PxeType = {
  subnet_id: 0,
  pxe_type: "ipxe", // "grub" "syslinux"
  pxeRoot: "/pxeboot",
  imgRoot: "/pxeboot/os-image",
  pxeAuto: "/pxeboot/os-image",
  TFTP_SERVER: "(None)",
  HTTP_SERVER: "(None)",
  NFS_SERVER: "(None)",
  iSCSI_SERVER: "(None)",
  SMB_SERVER: "(None)",
  DHCP_PROXY: "(None)",
  DHCP_SERVER: "(None)",
  DNS_SERVER: "(None)",
  NTP_SERVER: "(None)",
  ISO_UTILS: "(None)",
  is_active: true,
};

export type SubnetType = {
  id: number;
  interface_id: number;
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
  cidr: string;
  scope_id?: number;
  // ip4_class: string;
  ip4_netaddress: string;
  ip4_begin: string;
  ip4_end: string;
  ip4_router: string;
  ip4_dnslist: string;
  ip4_dnsdomain: string;
  prefix: string;
  is_active?: boolean;
  // Pxes?: PxeType[];
  // Clusters?: ClusterType[];
};

export type RackSubnet = SubnetType & {
  Pxes: PxeType[];
}

export const unknownNet: RackSubnet = {
  id: 0,
  interface_id: 0,
  address: "",
  netmask: "",
  family: "",
  mac: "",
  internal: false,
  cidr: "",
  scope_id: 0,
  // ip4_class: "C",
  ip4_netaddress: "",
  ip4_begin: "",
  ip4_end: "",
  ip4_router: "",
  ip4_dnslist: "",
  ip4_dnsdomain: "example.lan",
  prefix: "",
  is_active: false,
  Pxes: [],
};

export type InterfaceType = {
  id: number;
  nic_name: string;
  nic_mac: string;
  is_active?: boolean | null;
  // Subnets?: RackSubnet[];
};

export type RackInterface = InterfaceType & {
  Subnets: RackSubnet[];
};

export const unknownNic: RackInterface = {
  id: 0,
  nic_name: "--- Select a network interface ---",
  nic_mac: "ff:ff:ff:ff:ff:ff",
  is_active: null,
  Subnets: [],
};

export const utilsList = ["xorriso", "genisoimage", "cpio", "zstd", "7zip"];

export interface PxeOptionsType {
  name: string;
  folder: string;
  avoid: boolean;
}

export const unknownPxe: PxeOptionsType = {
  name: "--- Select a pxe boot loader ---",
  folder: "",
  avoid: true,
};

export type rackModuleAreas = {
  dhcpModules: moduleType[];
  proxyModules: moduleType[];
  dnsModules: moduleType[];
  httpModules: moduleType[];
  nfsModules: moduleType[];
  ntpModules: moduleType[];
  pxeModules: moduleType[];
  tftpModules: moduleType[];
};

export const rackEmptyAreas: rackModuleAreas = {
  dhcpModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  proxyModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  dnsModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  httpModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  nfsModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  ntpModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  pxeModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
  tftpModules: [{moduleName: "(None)", moduleRoles:defaultRoles, moduleStatus:0}],
}
