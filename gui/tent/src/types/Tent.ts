import type { moduleType } from "@/types/Addon";
import { defaultRoles } from "@/types/Addon";
import type { SubnetType, InterfaceType } from "@/types/Rack";

export type HostType = {
  id: number;
  ip: string;
  host: string;
  cluster_id: number;
  suffix: string;
  ping: boolean;
  ssh: boolean;
  is_active?: boolean;
  cluster_node?: boolean;
  compute_node?: boolean;
  compute_role?: number;
  storage_node?: boolean;
  storage_role: number;
  balancer_node?: boolean;
  balancer_role: number;
  local_storage?: string;
  local_storage_type?: number;
  local_compute_type?: number;
};

export type ClusterType = {
  id: number;

  // plat membership
  plat_id?: number;
  plat_member?: boolean;
  embedding_member?: boolean;
  embedding_model?: number;
  vectordb_member?: boolean;
  vectordb_vendor?: number;
  llm_member?: boolean;
  llm_model?: number;

  // generic info
  subnet_id: number;
  cluster_name: string;
  cluster_note: string;
  is_active?: boolean;
  is_locked?: boolean;
  build_auto_lock?: boolean;

  // load balancer
  balancer_cluster_type?: number;
  balancer_cluster_vip?: string;
  balancer_protocol?: string;
  balancer_port?: string;
  peer_interface?: string;
  peer_pass_secret?: string;

  // compute cluster
  compute_cluster_type?: number;
  compute_cluster_dashboard?: number;
  local_compute_type?: number;

  // storage cluster
  storage_cluster_type?: number;
  storage_cluster_share: string;
  storage_cluster_dashboard?: number;
  local_storage_type: number;
  local_storage_default: string;

  // member hosts
  Hosts: HostType[];
};

export const emptyCluster: ClusterType = {
  id: 0,

  // plat membership
  // plat_id: 0,
  // plat_member: false,
  // embedding_member: false,
  // embedding_model: 0,
  // vectordb_member: false,
  // vectordb_vendor: 0,
  // llm_member: false,
  // llm_model: 0,

  // generic info
  subnet_id: 0,
  cluster_name: "",
  cluster_note: "",
  is_active: false,
  is_locked: false,
  build_auto_lock: true,

  // load balancer
  balancer_cluster_type: 0,

  // compute cluster
  compute_cluster_type: 0,
  local_compute_type: 0,

  // storage cluster
  storage_cluster_type: 0,
  storage_cluster_share: "",
  local_storage_type: 0,
  local_storage_default: "",

  // member hosts
  Hosts: [],
};

export type TentSubnet = SubnetType & {
  Clusters: ClusterType[];
};

export type tentModuleAreas = {
  storageModules: moduleType[];
  computeModules: moduleType[];
  balancerModules: moduleType[];
  dashboardModules: moduleType[];
};

export type TentInterface = InterfaceType & {
  Subnets: TentSubnet[];
};

export const unknownNic: TentInterface = {
  id: 0,
  nic_name: "--- Select a network interface ---",
  nic_mac: "ff:ff:ff:ff:ff:ff",
  is_active: null,
  Subnets: [],
};

export const tentEmptyAreas: tentModuleAreas = {
  storageModules: [
    {
      moduleName: "(None)",
      moduleRoles: defaultRoles,
      moduleStatus: 0,
      compatibility: null,
    },
  ],
  computeModules: [
    {
      moduleName: "(None)",
      moduleRoles: defaultRoles,
      moduleStatus: 0,
      compatibility: null,
    },
  ],
  balancerModules: [
    {
      moduleName: "(None)",
      moduleRoles: defaultRoles,
      moduleStatus: 0,
      compatibility: null,
    },
  ],
  dashboardModules: [
    {
      moduleName: "(None)",
      moduleRoles: defaultRoles,
      moduleStatus: 0,
      compatibility: null,
    },
  ],
};

export const defaultCluster = {
  cluster_name: "-- available hosts --",
  cluster_disp: "-- select a cluster --",
  cluster_note: "_@_",
};

export const localComputeTypes = ["(CPU Only)", "Nvidia GPU", "AMD GPU"];
export const localStorageTypes = ["Hard Disk", "Image File", "Local Folder"];
