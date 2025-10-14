const path = require("path");
const { StackModules } = require("@utils/stackModules");
const { localStorageTypes, localComputeTypes } = require("@consts/constant");
const { pluginModuleTypes } = require("@consts/constant");

const dotenv = require("dotenv");
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { CLUSTER_USER, CLUSTER_PASS, CLUSTER_CERT } = process.env;

const stack = "tent";
const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
const moduleDatabase = path.join(
  __dirname,
  `../modules/${stack}`,
  `module.mdb`
);
const curTentModule = StackModules(stack, moduleTypes, moduleDatabase);

const PopulateTentObject = (adminHostIpv4, currentCluster, currentMembers) => {
  const confObject = {
    hci_id: 0,
    hci_name: "",
    resource: {},
    compute: {},
    storage: {},
    balancer: {},
    dashboard: {},
    serviceAccount: {},
    original: {},
  };
  try {
    const clusterNodes = currentMembers.filter((m) => m.cluster_node);
    confObject.resource.hosts = clusterNodes.map((m) => {
      return { host: m.host, ip: m.ip };
    });

    // Populate HCI ID & name
    confObject.hci_id = currentCluster.id;
    confObject.hci_name = currentCluster.cluster_name;

    // Populate Compute Cluster Details
    const computeNodes = clusterNodes.filter((m) => m.compute_node);
    const clusterTypeId = currentCluster.compute_cluster_type || 0;
    const clusterType = curTentModule.computeModules[clusterTypeId].moduleName;
    const computeRoes = curTentModule.computeModules[clusterTypeId].moduleRoles;
    confObject.compute.type = clusterType;
    confObject.compute.admin = adminHostIpv4;
    confObject.compute.nodes = computeNodes.map((m) => m.ip);

    switch (clusterType) {
      case "Kubernetes":
        confObject.compute.managers = computeNodes
          .filter((m) => (m.compute_role & 1) === 1)
          .map((m) => m.ip);
        confObject.compute.workers = computeNodes
          .filter((m) => (m.compute_role & 2) === 2)
          .map((m) => m.ip);
        confObject.compute.reqtakers = computeNodes
          .filter((m) => (m.compute_role & 1) === 1)
          .map((m) => m.ip);
        /* original info*/
        confObject.original[computeRoes[1].role] = computeNodes
          .filter((m) => (m.compute_role & 1) === 1)
          .map((m) => m.ip);
        confObject.original[computeRoes[2].role] = computeNodes
          .filter((m) => (m.compute_role & 2) === 2)
          .map((m) => m.ip);
        break;
      case "Swarm":
        confObject.compute.managers = computeNodes
          .filter((m) => (m.compute_role & 1) === 1)
          .map((m) => m.ip);
        confObject.compute.workers = computeNodes
          .filter((m) => (m.compute_role & 2) === 2)
          .map((m) => m.ip);
        confObject.compute.reqtakers = computeNodes.map((m) => m.ip);
        break;
      default: //others
        confObject.compute.managers = computeNodes
          .filter((m) => m.compute_role > 0)
          .map((m) => m.ip);
        confObject.compute.workers = computeNodes
          .filter((m) => m.compute_role > 0)
          .map((m) => m.ip);
        confObject.compute.reqtakers = computeNodes
          .filter((m) => m.compute_role > 0)
          .map((m) => m.ip);
        break;
    }
    if (clusterTypeId) {
      confObject.compute.spares = computeNodes
        .filter((m) => !(m.compute_role ?? 0))
        .map((m) => m.ip);
    }
    confObject.compute.dashboard =
      curTentModule.dashboardModules[
        parseInt(currentCluster.compute_cluster_dashboard) || 0
      ].moduleName;
    confObject.compute.node_type = currentCluster.local_compute_type || 0;
    confObject.compute.node_desc =
      localComputeTypes[currentCluster.local_compute_type || 0];

    // Populate Storage Cluster Details
    const storageNodes = clusterNodes.filter((m) => m.storage_node);
    const storageTypeId = currentCluster.storage_cluster_type || 0;
    const storageType = curTentModule.storageModules[storageTypeId].moduleName;
    confObject.storage.type = storageType;
    confObject.storage.nodes = storageNodes.map((m) => m.ip);
    switch (storageType) {
      case ("Ceph", "Gluster"): // gluster & ceph
      default:
        confObject.storage.members = storageNodes
          .filter((m) => (m.storage_role & 1) === 1)
          .map((m) => m.ip);
        confObject.storage.clients = storageNodes
          .filter((m) => (m.storage_role & 2) === 2)
          .map((m) => m.ip);
        break;
    }
    if (storageTypeId) {
      confObject.storage.spares = storageNodes
        .filter((m) => !(m.storage_role ?? 0))
        .map((m) => m.ip);
    }

    confObject.storage.dashboard =
      curTentModule.dashboardModules[
        parseInt(currentCluster.storage_cluster_dashboard) || 0
      ].moduleName;
    confObject.storage.local = currentCluster.local_storage_default;
    confObject.storage.local_type = currentCluster.local_storage_type || 0;
    confObject.storage.local_desc =
      localStorageTypes[currentCluster.local_storage_type || 0];
    confObject.storage.global_share = currentCluster.storage_cluster_share;

    // Populate Load Balancer Details
    const balancerNodes = clusterNodes.filter((m) => m.balancer_node);
    const balancerTypeId = currentCluster.balancer_cluster_type || 0;
    const balancerType =
      curTentModule.balancerModules[balancerTypeId].moduleName;
    confObject.balancer.type = balancerType;
    confObject.balancer.nodes = balancerNodes.map((m) => m.ip);
    confObject.balancer.members = balancerNodes
      .filter((m) => m.balancer_role)
      .map((m) => m.ip);
    if (balancerTypeId) {
      confObject.balancer.spares = balancerNodes
        .filter((m) => !(m.balancer_role ?? 0))
        .map((m) => m.ip);
    }

    // confObject.balancer.dashboard =
    //   curTentModule.dashboardModules[
    //     parseInt(currentCluster.balancer_cluster_dashboard) || 0
    //   ].moduleName;
    confObject.balancer.virtualIp = currentCluster.balancer_cluster_vip;
    confObject.balancer.protocol = currentCluster.balancer_protocol ?? "TCP";
    confObject.balancer.port = currentCluster.balancer_port ?? "80";
    confObject.balancer.peerPass = currentCluster.peer_pass_secret;
    confObject.balancer.interface = currentCluster.peer_interface;

    // Populate HCI Cluster dashboard Details
    confObject.dashboard = {};
    // confObject.dashboard.type = `Portainer`;
    // confObject.dashboard.storageType =
    //   curTentModule.storageModules[currentCluster.storage_cluster_type || 0];

    confObject.serviceAccount.username = `${CLUSTER_USER}`;
    confObject.serviceAccount.password = `${CLUSTER_PASS}`;
    confObject.serviceAccount.certname = `${CLUSTER_CERT}`;

    //
    // let confContent = JSON.stringify(confObject);
    //
    // fs.writeFileSync(`${ConfFile}`, confContent);
    return { code: 0, data: confObject };
  } catch (err) {
    return { code: -1, data: err };
  }
};

module.exports = { PopulateTentObject };
