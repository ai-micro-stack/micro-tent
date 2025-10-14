const path = require("path");
const { StackModules } = require("@utils/stackModules");
const { localStorageTypes, localComputeTypes } = require("@consts/constant");
const { PopulateTentObject } = require("@utils/tentObject");
const Host = require("@models/host.model");
const { pluginModuleTypes } = require("@consts/constant");

const dotenv = require("dotenv");
const environment = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
dotenv.config({ path: `.env.${environment}` });
const { CLUSTER_USER, CLUSTER_PASS, CLUSTER_CERT } = process.env;

const stack = "plat";
const moduleTypes = pluginModuleTypes[`${stack}Plugin`];
const moduleDatabase = path.join(
  __dirname,
  `../modules/${stack}`,
  `module.mdb`
);
const curPlatModule = StackModules(stack, moduleTypes, moduleDatabase);

const PopulatePlatObject = (currentPlat, platMembers) => {
  // const clusterObject = {
  //   resource: {},
  //   compute: {},
  //   storage: {},
  //   balancer: {},
  //   dashboard: {},
  //   serviceAccount: {},
  // };
  const confObject = {
    plat_id: 0,
    plat_name: "",
    resource: {},
    embedding: {},
    vectordb: {},
    llm: {},
    // dashboard: {},
    // serviceAccount: {},
  };
  try {
    const platClusters = platMembers.map((c) => {
      // const hosts = await Host.findAll({
      //   where: {
      //     cluster_id: c.cluster_id,
      //   },
      // });
      // return PopulateTentObject("adminIp", c, hosts);
      return {
        hci_id: c.cluster_id,
        hci_name: c.cluster_name,
        hci_nodes: c.cluster_nodes,
        balancer: {
          balancer_cluster: c.balancer_cluster,
          balancer_cluster_type: c.balancer_cluster_type,
          balancer_nodes: c.balancer_nodes,
          balancer_cluster_vip: c.balancer_cluster_vip,
          balancer_protocol: c.balancer_protocol,
          balancer_port: c.balancer_port,
        },
        compute: {
          compute_cluster: c.compute_cluster,
          compute_cluster_type: c.compute_cluster_type,
          compute_nodes: c.compute_nodes,
        },
        storage: {
          storage_cluster: c.storage_cluster,
          storage_cluster_type: c.storage_cluster_type,
          storage_nodes: c.storage_nodes,
        },
        plat_member: c.plat_member,
        embedding_member: c.embedding_member,
        embedding_model: c.embedding_model,
        embedding_model_name: c.embedding_model_name,
        embedding_module: c.embedding_module,
        vectordb_member: c.vectordb_member,
        vectordb_vendor: c.vectordb_vendor,
        vectordb_vendor_name: c.vectordb_vendor_name,
        vectordb_module: c.vectordb_module,
        llm_member: c.llm_member,
        llm_model: c.llm_model,
        llm_model_name: c.llm_model_name,
        llm_module: c.llm_module,
        Hosts: c.Hosts,
      };
    });

    // Populate plat Id & name
    confObject.plat_id = currentPlat.id;
    confObject.plat_name = currentPlat.plat_name;
    confObject.embedding.model_store = currentPlat.embedding_model_store ?? "";
    confObject.llm.model_store = currentPlat.llm_model_store ?? "";
    confObject.vectordb.data_store = currentPlat.vectordb_data_store ?? "";

    // Populate plat resource
    confObject.resource.clusters = platClusters
      .filter((c) => c.plat_member)
      .map((c) => {
        // const hosts = await Host.findAll({
        //   where: {
        //     cluster_id: c.cluster_id,
        //   },
        // });
        // return PopulateTentObject("adminIp", c, hosts);
        return {
          hci_id: c.hci_id,
          hci_name: c.hci_name,
          hci_nodes: c.hci_nodes,
          balancer: c.balancer,
          compute: c.compute,
          storage: c.storage,
          hosts: c.Hosts,
        };
      });

    // Populate plat embedding members
    confObject.embedding.members = platClusters
      .filter((c) => c.embedding_member)
      .map((c) => {
        return {
          hci_id: c.hci_id,
          hci_name: c.hci_name,
          // embedding_member: c.embedding_member,
          embedding_module: c.embedding_module,
          embedding_model: c.embedding_model,
          embedding_model_name: c.embedding_model_name,
          nodes: c.Hosts.filter((h) => h.compute_node),
          // .map( h => {
          //   return {
          //     h.id,
          //     h.ip,
          //     h.host,
          //     h.compute_role
          //   }
          // })
        };
      });

    // Populate plat vectordb members
    confObject.vectordb.members = platClusters
      .filter((c) => c.vectordb_member)
      .map((c) => {
        return {
          hci_id: c.hci_id,
          hci_name: c.hci_name,
          // embedding_member: c.vectordb_member,
          vectordb_module: c.vectordb_module,
          vectordb_vendor: c.vectordb_vendor,
          vectordb_vendor_name: c.vectordb_vendor_name,
          nodes: c.Hosts.filter((h) => h.compute_node),
          // .map( h => {
          //   return {
          //     h.id,
          //     h.ip,
          //     h.host,
          //     h.compute_role
          //   }
          // })
        };
      });

    // Populate plat llm members
    confObject.llm.members = platClusters
      .filter((c) => c.llm_member)
      .map((c) => {
        return {
          hci_id: c.hci_id,
          hci_name: c.hci_name,
          // llm_member: c.llm_member,
          llm_module: c.llm_module,
          llm_model: c.llm_model,
          llm_model_name: c.llm_model_name,
          nodes: c.Hosts.filter((h) => h.compute_node),
          // .map( h => {
          //   return {
          //     h.id,
          //     h.ip,
          //     h.host,
          //     h.compute_role
          //   }
          // })
        };
      });

    // Populate plat dashboard
    confObject.dashboard = {};

    return { code: 0, data: confObject };
  } catch (err) {
    return { code: -1, data: err };
  }
};

module.exports = { PopulatePlatObject };
