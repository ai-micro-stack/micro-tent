import type { RackInterface } from "@/types/Rack";
import type { TentInterface } from "@/types/Tent";

/* stack utils */

function getActiveSubnets(nicTrees: TentInterface[], nicId: number) {
  let activeNetId = 0;
  for (let i = 0; i < nicTrees[nicId].Subnets.length; i++) {
    if (nicTrees[nicId].Subnets[i].is_active) {
      activeNetId = i;
      break;
    }
  }
  return {
    Subnets: nicTrees[nicId].Subnets,
    subnetId: activeNetId,
  };
}

/* rack utils */

function getActivePxes(
  nicTrees: RackInterface[],
  nicId: number,
  netId: number
) {
  let activePxeId = 0;
  for (let i = 0; i < nicTrees[nicId].Subnets[netId].Pxes.length; i++) {
    if (nicTrees[nicId].Subnets[netId].Pxes[i].is_active) {
      activePxeId = i;
      break;
    }
  }
  return {
    Pxes: nicTrees[nicId].Subnets[netId].Pxes,
    pxeId: activePxeId,
  };
}

function getPxeDetails(
  // useCase: string, //"finder", "planner" or "builder"
  nicTrees: RackInterface[],
  nicId: number,
  netId: number,
  pxeId: number
) {
  const pxeDetails = nicTrees[nicId].Subnets[netId]?.Pxes.map((p) => {
    return { ...p, ISO_UTILS: p.ISO_UTILS.trim() ? p.ISO_UTILS.trim() : "" };
  });
  return pxeDetails && pxeDetails[pxeId] ? pxeDetails[pxeId] : null;
  // return {...pxeDetails, ISO_UTILS: pxeDetails.ISO_UTILS.trim() ? pxeDetails.ISO_UTILS.trim() : utilsList.join(" ")};
}

/* tent utils */

function getActiveClusters(
  nicTrees: TentInterface[],
  nicId: number,
  netId: number
) {
  let activeCluId = 0;
  for (let i = 0; i < nicTrees[nicId].Subnets[netId].Clusters.length; i++) {
    if (nicTrees[nicId].Subnets[netId].Clusters[i].is_active) {
      activeCluId = i;
      break;
    }
  }
  return {
    Clusters: nicTrees[nicId].Subnets[netId].Clusters.map((c) => {
      return {
        ...c,
        compute_cluster_type: c.compute_cluster_type ?? 0,
        storage_cluster_type: c.storage_cluster_type ?? 0,
      };
    }),
    clusterId: activeCluId,
  };
}

function getActiveHosts(
  useCase: string, //"finder", "planner" or "builder"
  nicTrees: TentInterface[],
  nicId: number,
  netId: number,
  cluId: number | null
) {
  /*
  with useCase & currentId as the condition,
  function tells whether scanId is in scope
  */
  function InScope(
    useCase: string,
    clusterId: number | null,
    scanId: number
  ): boolean {
    let result = false;
    switch (useCase) {
      case "finder":
        result = clusterId === null;
        break;
      case "planner":
        result = scanId === clusterId || scanId === 0;
        break;
      case "builder":
        result = scanId === clusterId;
        break;
      default:
        result = scanId === clusterId || scanId === 0 || clusterId === null;
        break;
    }
    return result;
  }
  const visibleHosts = nicTrees[nicId].Subnets[netId].Clusters.filter(
    (c, i) => {
      // return (cluId === null || i === 0 || i === cluId) && c.Hosts.length > 0;
      return InScope(useCase, cluId, i) && c.Hosts.length > 0;
    }
  )
    .map((c) => {
      return c.Hosts.map((h) => {
        return {
          ...h,
          local_storage: h.local_storage ?? c.local_storage_default,
          local_storage_type: h.local_storage_type ?? c.local_storage_type,
          local_compute_type: h.local_compute_type ?? c.local_compute_type,
        };
      });
    })
    .flat();

  return {
    Hosts: visibleHosts
      .filter((h) => (cluId === null ? h.ping || h.ssh : h.is_active))
      .map((h) => {
        return {
          ...h,
          is_active: h.is_active === null ? h.ping && h.ssh : h.is_active,
          compute_node: h.cluster_node ? h.compute_node ?? false : false,
          storage_node: h.cluster_node ? h.storage_node ?? false : false,
          balancer_node: h.cluster_node ? h.balancer_node ?? false : false,
        };
      })
      .sort((a, b) => {
        const weightA = a.host;
        const weightB = b.host;
        if (weightA < weightB) {
          return -1;
        }
        if (weightA > weightB) {
          return 1;
        }
        return 0;
      }),
  };
}

/* final export */

export {
  getActiveSubnets,
  getActivePxes,
  getPxeDetails,
  getActiveClusters,
  getActiveHosts,
};
