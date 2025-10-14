require("module-alias/register");
const { createConnection } = require("node:net");
const { db } = require("@database/db");
const Plat = require("@models/plat.model");
const Interface = require("@models/interface.model");
const Subnet = require("@models/subnet.model");
const Host = require("@models/host.model");
const Pxe = require("@models/pxe.model");
const Cluster = require("@models/cluster.model");
const Static = require("@models/static.model");
const { cidrParser } = require("@utils/stackParser");
const { defaultCluster } = require("@consts/constant");
const { ipClassInd } = require("@consts/constant");

function padNumber(num, size) {
  const s = "000000000" + num;
  return s.slice(s.length - size);
}

function getIp4Class(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

function ModelUpsert(model, values, condition) {
  return model.findOne({ where: condition }).then(function (obj) {
    // update
    if (obj) return obj.update(values);
    // insert
    return model.create(values);
  });
}

async function UpdatePlat(platItem) {
  const result = await ModelUpsert(Plat, platItem, {
    id: platItem.id,
  });
  return result;
}

async function AddPlat(platItem) {
  const expectedPlat = { ...platItem };

  const result = await ModelUpsert(Plat, expectedPlat, {
    plat_name: expectedPlat.plat_name,
  });
  return result;
}

async function AddPlats(PlatList) {
  for (plat in PlatList) {
    await AddPlat(PlatList[plat]);
  }
}

async function AddInterfaces(NicList) {
  async function AddInterface(nicItem) {
    const expectedInterface = {
      nic_name: nicItem.nic_name,
      nic_mac: nicItem.nic_mac,
    };

    const result = await ModelUpsert(Interface, expectedInterface, {
      nic_mac: expectedInterface.nic_mac,
    });
    return result;
  }

  for (nic in NicList) {
    await AddInterface(NicList[nic]);
  }
}

async function AddSubnets(netList) {
  const addedNets = [];
  async function AddSubnet(netItem) {
    const interface = await Interface.findOne({
      where: { nic_mac: netItem.mac },
    });
    const cidrParseParts = cidrParser(netItem.cidr);
    const ip4Class = getIp4Class(ipClassInd, netItem.cidr.split(".")[0]) ?? "";
    const expectedSubnet = {
      interface_id: interface.id,
      address: netItem.address,
      netmask: netItem.netmask,
      family: netItem.family,
      mac: netItem.mac,
      internal: netItem.internal,
      cidr: netItem.cidr,
      scopeid: netItem.scopeid,
      ip4_class: netItem.ip4_class ?? ip4Class,
      ip4_netaddress: netItem.ip4_netaddress ?? cidrParseParts.dhcpNetAddress,
      ip4_begin: netItem.ip4_begin ?? cidrParseParts.dhcpStart,
      ip4_end: netItem.ip4_end ?? cidrParseParts.dhcpEnd,
      ip4_router: netItem.ip4_router ?? cidrParseParts.dhcpRouter,
      ip4_dnslist: netItem.ip4_dnslist ?? cidrParseParts.dhcpDnsList,
      ip4_dnsdomain: netItem.ip4_dnsdomain ?? "example.lan",
      prefix: cidrParseParts.Host ?? "host",
    };

    // const subnet = await Subnet.findOne({
    //   where: { mac: netItem.mac, cidr: netItem.cidr },
    // });
    // if (subnet) return subnet;

    const result = await ModelUpsert(Subnet, expectedSubnet, {
      cidr: expectedSubnet.cidr,
    });

    const expectedCluster = {
      ...defaultCluster,
      subnet_id: result.id,
    };
    const cl_result = await ModelUpsert(
      Cluster,
      expectedCluster,
      expectedCluster
    );
    return result;
  }

  for (cidrId in netList) {
    const addedNet = await AddSubnet(netList[cidrId]);
    addedNets.push(addedNet);
  }
  return addedNets;
}

async function UpdatePxe(pxeItem) {
  const result = await ModelUpsert(Pxe, pxeItem, {
    id: pxeItem.id,
  });
  return result;
}

async function AddPxe(pxeItem) {
  const result = await ModelUpsert(Pxe, pxeItem, {
    subnet_id: pxeItem.subnet_id,
    pxe_type: pxeItem.pxe_type,
  });
  return result;
}

async function UpdateCluster(clusterItem) {
  const result = await ModelUpsert(Cluster, clusterItem, {
    id: clusterItem.id,
  });
  return result;
}

async function AddCluster(clusterItem) {
  const result = await ModelUpsert(Cluster, clusterItem, {
    subnet_id: clusterItem.subnet_id,
    cluster_name: clusterItem.cluster_name,
  });
  return result;
}

async function UpdateClusters(clusterList) {
  const members = clusterList.map((c) => {
    return {
      id: c.cluster_id,
      plat_id: c.plat_id,
      plat_member: c.plat_member,
      embedding_member: c.embedding_member,
      embedding_model: c.embedding_model,
      vectordb_member: c.vectordb_member,
      vectordb_vendor: c.vectordb_vendor,
      llm_member: c.llm_member,
      llm_model: c.llm_model,
    };
  });
  // await Cluster.bulkCreate(members, {
  //   updateOnDuplicate: ["plat_id", "plat_member"],
  // });

  for (const c of members) {
    await Cluster.update(
      {
        plat_id: c.plat_id,
        plat_member: c.plat_member,
        embedding_member: c.embedding_member,
        embedding_model: c.embedding_model,
        vectordb_member: c.vectordb_member,
        vectordb_vendor: c.vectordb_vendor,
        llm_member: c.llm_member,
        llm_model: c.llm_model,
      },
      { where: { id: c.id } }
    );
  }

  // await db.transaction(async (t) => {
  //   for (const c of members) {
  //     await Model.update(
  //       { plat_id: c.plat_id, plat_member: c.plat_member },
  //       { where: { id: c.id }, transaction: t }
  //     );
  //   }
  // });
}

async function AddHosts(hostList) {
  async function AddHost(hostItem) {
    const expectedHost = {
      ...hostItem,
      is_active: hostItem.is_active === undefined ? null : hostItem.is_active,
    };

    const result = await ModelUpsert(Host, expectedHost, {
      ip: expectedHost.ip,
    });
    return result;
  }

  for (hostItem in hostList) {
    await AddHost(hostList[hostItem]);
  }
}

async function AddStatics(staticList) {
  async function AddStatic(staticItem) {
    const expectedStatic = {
      ...staticItem,
      is_active:
        staticItem.is_active === undefined ? null : staticItem.is_active,
    };

    const result = await ModelUpsert(Static, expectedStatic, {
      mac_address: expectedStatic.mac_address,
    });
    return result;
  }

  for (staticItem in staticList) {
    await AddStatic(staticList[staticItem]);
  }
}

async function GetHostsByCidr(subnet_id, subnet_cidr, subnet_prefix) {
  const cidrParseParts = cidrParser(subnet_cidr);
  const ip4_1s = cidrParseParts.dhcpStart.split(".").map((p) => parseInt(p));
  const ip4_2s = cidrParseParts.dhcpEnd.split(".").map((p) => parseInt(p));
  const netmask = cidrParseParts.dhcpNetMask.split(".").map((p) => parseInt(p));
  const ip4_1i =
    ((ip4_1s[0] * 256 + ip4_1s[1]) * 256 + ip4_1s[2]) * 256 + ip4_1s[3];
  const ip4_2i =
    ((ip4_2s[0] * 256 + ip4_2s[1]) * 256 + ip4_2s[2]) * 256 + ip4_2s[3];

  let potentialHosts = [];
  for (i = ip4_1i; i <= ip4_2i; i++) {
    let ip = "";
    let suffix = "";
    let dot = "";
    for (j = 3, k = i; j >= 0; j--) {
      let r = k % 256;
      ip = r.toString() + dot + ip;
      suffix = (netmask[j] === 255 && j < 2 ? "" : padNumber(r, 3)) + suffix;
      k = Math.floor(k / 256);
      dot = ".";
    }
    potentialHosts.push({ ip, suffix });
  }

  return potentialHosts;
}

//   for (cidrId in cidrList) {
//     await AddSubnet(cidrList[cidrId]);
//   }
// }

/**
 * Ping a given host and resolve with the response time in milliseconds,
 * or -1 if there was an error.
 */
async function portPing(hostname, port = 80, timeout = 1000) {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = createConnection(port, hostname);
    socket.setTimeout(timeout);
    socket.on("connect", () => {
      const end = performance.now();
      socket.end();
      resolve({ host: hostname, alive: true, value: end - start });
    });

    function handleError() {
      socket.destroy();
      resolve({ host: hostname, alive: false, value: -1 });
    }

    socket.on("timeout", handleError);
    socket.on("error", handleError);
  });
}

async function DiskScan(hostname, port = 80, timeout = 1000) {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = createConnection(port, hostname);
    socket.setTimeout(timeout);
    socket.on("connect", () => {
      const end = performance.now();
      socket.end();
      resolve({ host: hostname, alive: true, value: end - start });
    });

    function handleError() {
      socket.destroy();
      resolve({ host: hostname, alive: false, value: -1 });
    }

    socket.on("timeout", handleError);
    socket.on("error", handleError);
  });
}

module.exports = {
  AddPlats,
  AddPlat,
  UpdatePlat,
  AddInterfaces,
  AddSubnets,
  AddPxe,
  UpdatePxe,
  AddCluster,
  UpdateCluster,
  UpdateClusters,
  AddHosts,
  AddStatics,
  GetHostsByCidr,
  portPing,
  DiskScan,
};
