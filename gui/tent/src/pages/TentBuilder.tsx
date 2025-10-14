import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Row, Col, Table, Button, Alert, Modal } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import type {
  TentInterface,
  TentSubnet,
  ClusterType,
  HostType,
  tentModuleAreas,
} from "@/types/Tent";
import type { moduleRole } from "@/types/Addon";
import { defaultRoles } from "@/types/Addon";
import {
  tentEmptyAreas,
  unknownNic,
  emptyCluster,
  defaultCluster,
} from "@/types/Tent";
import {
  getActiveHosts,
  getActiveClusters,
  getActiveSubnets,
} from "@/utils/activeResource";
import { storeGuiContext, fetchGuiContext } from "@/utils/currentContext";
import { TerminalModal } from "@/components/WebTerminal";

function TentBuilder() {
  const bntInitState = {
    save: false,
    buld: true,
    dash: true,
    prev: false,
    next: false,
  };
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [curContext, setCurContext] = useState({
    ...fetchGuiContext("tent.context"),
  });
  const [nicTreeId, setNicTreeId] = useState(0);
  const [subnetId, setSubnetId] = useState(0);
  const [clusterId, setClusterId] = useState<number | null>(0);

  const [refresh, setRefresh] = useState(0);
  const [nicTrees, setNicTrees] = useState<TentInterface[]>([unknownNic]);

  const [subnets, setSubnets] = useState<TentSubnet[]>([]);

  const [clusters, setClusters] = useState<ClusterType[]>([]);
  const [curCluster, setCurCluster] = useState<ClusterType>(emptyCluster);

  const [hostTuples, setHostTuples] = useState<HostType[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalAlert, setModalAlert] = useState(false);
  const [validated, setValidated] = useState(false);

  const [clusterAreas, setClusterAreas] =
    useState<tentModuleAreas>(tentEmptyAreas);

  const [computeRoles, setComputeRoles] = useState<moduleRole[]>(defaultRoles);
  const [storageRoles, setStorageRoles] = useState<moduleRole[]>(defaultRoles);
  const [balancerRoles, setBalancerRoles] =
    useState<moduleRole[]>(defaultRoles);

  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(
    () => {
      (() => {
        axiosInstance
          .get("/tentbuild/modules")
          .then(({ data }) => {
            setClusterAreas({ ...data });
          })
          .catch((error) =>
            console.error("Get cluster config data failed ", error)
          );
      })();
    },
    // eslint-disable-next-line
    [refresh]
  );

  useEffect(() => {
    axiosInstance
      .get("/tentplan/data")
      .then(({ data }) => {
        setNicTrees([unknownNic, ...data.Interfaces]);
        setNicTreeId(curContext.nicTreeId);
      })
      .catch((error) =>
        console.error("Get cluster config data failed ", error)
      );
  }, [clusterAreas]);

  useEffect(
    () => {
      if (nicTrees.length > nicTreeId) {
        const activeSubnets = getActiveSubnets(nicTrees, nicTreeId);
        setSubnets(activeSubnets.Subnets);
        setSubnetId(curContext.subnetId);
      } else setNicTreeId(0);
    },
    // eslint-disable-next-line
    [nicTrees, nicTreeId]
  );

  useEffect(
    () => {
      if (subnets.length > subnetId) {
        const activeClusters = getActiveClusters(nicTrees, nicTreeId, subnetId);
        setClusters(activeClusters.Clusters);
        setClusterId(curContext.clusterId ?? 0);
      } else setSubnetId(0);
    },
    // eslint-disable-next-line
    [subnets, subnetId]
  );

  useEffect(
    () => {
      if (clusterId === null || clusters.length > clusterId) {
        const activeHosts = getActiveHosts(
          "builder",
          nicTrees,
          nicTreeId,
          subnetId,
          clusterId
        );
        setHostTuples(activeHosts.Hosts);

        setCurCluster(
          nicTrees[nicTreeId].Subnets[subnetId].Clusters[clusterId ?? 0]
        );
        if (clusterId && clusters.length > clusterId) {
          const clusterTypeId =
            nicTrees[nicTreeId].Subnets[subnetId].Clusters[clusterId ?? 0]
              .compute_cluster_type ?? 0;
          setComputeRoles(
            clusterAreas.computeModules[clusterTypeId].moduleRoles
          );
          const storageTypeId =
            nicTrees[nicTreeId].Subnets[subnetId].Clusters[clusterId ?? 0]
              .storage_cluster_type ?? 0;
          setStorageRoles(
            clusterAreas.storageModules[storageTypeId].moduleRoles
          );
          const BalancerTypeId =
            nicTrees[nicTreeId].Subnets[subnetId].Clusters[clusterId ?? 0]
              .balancer_cluster_type ?? 0;
          setBalancerRoles(
            clusterAreas.balancerModules[BalancerTypeId].moduleRoles
          );
        }
      }
    },
    // eslint-disable-next-line
    [clusterAreas, clusters, clusterId]
  );

  const changeNic = (targetNic: number) => {
    setCurContext({ ...curContext, nicTreeId: targetNic });
    storeGuiContext("tent.context", { ...curContext, nicTreeId: targetNic });
    setNicTreeId(targetNic);
    chgBntStatus("dirty");
  };
  const changeNet = (targetNet: number) => {
    setCurContext({ ...curContext, subnetId: targetNet });
    storeGuiContext("tent.context", { ...curContext, subnetId: targetNet });
    setSubnetId(targetNet);
    chgBntStatus("dirty");
  };
  const changeClu = (targetClu: number) => {
    setCurContext({ ...curContext, clusterId: targetClu });
    storeGuiContext("tent.context", { ...curContext, clusterId: targetClu });
    setClusterId(targetClu);
    chgBntStatus("dirty");
  };

  const handleModalShow = (id: number | null) => {
    const curClusterId = id ?? clusterId;
    const cluster: ClusterType = curClusterId
      ? clusters[curClusterId]
      : emptyCluster;
    setCurCluster(cluster);
    setModalAlert(false);
    setValidated(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setModalAlert(false);
    setValidated(false);
    setShowModal(false);
    setRefresh(refresh + 1);
  };

  const handleModalSave = () => {
    const postRoute = curCluster.id ? "update" : "create";
    axiosInstance
      .post(
        `/tentplan/${postRoute}`,
        {
          ...curCluster,
          subnet_id: subnets[subnetId].id,
          compute_cluster_type: curCluster.compute_cluster_type ?? 0,
          storage_cluster_type: curCluster.storage_cluster_type ?? 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            // "x-member-uuid": curCluster.id,
          },
        }
      )
      .then(({ data }) => {
        setShowModal(false);
        setComputeRoles(
          clusterAreas.computeModules[data.compute_cluster_type ?? 0]
            .moduleRoles
        );
        // setHostTuples(
        //   hostTuples.map((h) => {
        //     return { ...h, compute_role: 0 };
        //   })
        // );
        setStorageRoles(
          clusterAreas.storageModules[data.storage_cluster_type ?? 0]
            .moduleRoles
        );
        // setHostTuples(
        //   hostTuples.map((h) => {
        //     return { ...h, storage_role: 0 };
        //   })
        // );
        setBalancerRoles(
          clusterAreas.balancerModules[data.balancer_cluster_type ?? 0]
            .moduleRoles
        );
        // setHostTuples(
        //   hostTuples.map((h) => {
        //     return { ...h, balancer_role: 0 };
        //   })
        // );
        setRefresh(refresh + 1);
      })
      .catch((error) => {
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setModalAlert(true);
        console.error("Failed.", error);
      });
  };

  const changeNodeComputeRole = (nodeId: number, roleId: number) => {
    hostTuples[nodeId].compute_role = roleId;
  };
  const changeNodeStorageRole = (nodeId: number, roleId: number) => {
    hostTuples[nodeId].storage_role = roleId;
  };
  const changeNodeBalancerRole = (nodeId: number, roleId: number) => {
    hostTuples[nodeId].balancer_role = roleId;
  };

  const saveAssignment = () => {
    axiosInstance
      .post("/tentplan/save", {
        subnet_id: subnets[subnetId].id,
        cluster_0: subnets[subnetId].Clusters[0].id,
        cluster_id: subnets[subnetId].Clusters[clusterId ?? 0].id,
        Hosts: hostTuples.map((h) => {
          return { ...h };
        }),
      })
      .then(() => {
        chgBntStatus("save");
        axiosInstance
          .post("/tentbuild/conf", {
            subnet_id: subnets[subnetId].id,
            cluster_id: subnets[subnetId].Clusters[clusterId ?? 0].id,
            Subnet: subnets[subnetId],
            Cluster: curCluster, //clusters[clusterId ?? 0],
            Hosts: hostTuples.map((h) => {
              return { ...h };
            }),
          })
          .then(() => {
            chgBntStatus("save");
            // setRefresh(refresh + 1); /* commented out to prevent sntstatus*/
          })
          .catch((error) => {
            setErrMsg([
              error.message,
              error.status === 403
                ? "--- You don't have permission to make this operation."
                : "",
            ]);
            setShowAlert(true);
            console.error("Failed to build the cluster. ", error);
          });
        setRefresh(refresh + 1);
      })
      .catch((error) => {
        chgBntStatus("save");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to save the cluster assignment.", error);
      });
  };

  const buildCluster = () => {
    const confirmBuild = window.confirm(
      `You are about to build a HCI cluster with the current settings. Click OK to continue.`
    );
    if (!confirmBuild) return;
    chgBntStatus("none");
    axiosInstance
      .post("/tentplan/save", {
        subnet_id: subnets[subnetId].id,
        cluster_0: subnets[subnetId].Clusters[0].id,
        cluster_id: subnets[subnetId].Clusters[clusterId ?? 0].id,
        Hosts: hostTuples.map((h) => {
          return { ...h };
        }),
      })
      .then(() => {
        chgBntStatus("save");
        axiosInstance
          .post("/tentbuild/build", {
            subnet_id: subnets[subnetId].id,
            cluster_id: subnets[subnetId].Clusters[clusterId ?? 0].id,
            Subnet: subnets[subnetId],
            Cluster: curCluster, //clusters[clusterId ?? 0],
            Hosts: hostTuples.map((h) => {
              return { ...h };
            }),
          })
          .then(() => {
            chgBntStatus("buld");
            handleTerminalShow();
          })
          .then(() => {
            if (!curCluster.build_auto_lock) return;
            axiosInstance.post("/tentplan/update", {
              ...curCluster,
              is_locked: true,
            });
          })
          .then(() => {
            setRefresh(refresh + 1);
          })
          .catch((error) => {
            setErrMsg([
              error.message,
              error.status === 403
                ? "--- You don't have permission to make this operation."
                : "",
            ]);
            setShowAlert(true);
            console.error("Failed to build the cluster. ", error);
          });
      })
      .catch((error) => {
        chgBntStatus("buld");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to save the cluster assignment.", error);
      });
  };

  const setupDashboard = () => {
    const confirmDashboard = window.confirm(
      `You are about to setup all configured dashboards of current HCI cluster. Click OK to continue.`
    );
    if (!confirmDashboard) return;
    chgBntStatus("none");
    axiosInstance
      .post("/tentbuild/dash", {
        subnet_id: subnets[subnetId].id,
        cluster_id: subnets[subnetId].Clusters[clusterId ?? 0].id,
        Subnet: subnets[subnetId],
        Cluster: curCluster, //clusters[clusterId ?? 0],
        Hosts: hostTuples.map((h) => {
          return { ...h };
        }),
      })
      .then(() => {
        chgBntStatus("dash");
        handleTerminalShow();
      })
      .then(() => {
        if (!curCluster.build_auto_lock) return;
        axiosInstance.post("/tentplan/update", {
          ...curCluster,
          is_locked: true,
        });
      })
      .catch((error) => {
        chgBntStatus("dash");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to update the cluster changes.", error);
      });
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          save: true,
          buld: true,
          dash: true,
          prev: false,
          next: true,
        });
        break;
      case "save":
        setSpinning(false);
        setBntStatus({
          save: true,
          buld: false,
          dash: false,
          prev: false,
          next: true,
        });
        break;
      case "buld":
        setSpinning(false);
        setBntStatus({
          save: true,
          buld: true,
          dash: false,
          prev: false,
          next: false,
        });
        break;
      case "dash":
        setSpinning(false);
        setBntStatus({
          save: true,
          buld: true,
          dash: true,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          save: false,
          buld: false,
          dash: true,
          prev: false,
          next: true,
        });
        break;
    }
  };

  const handleTerminalShow = () => {
    setShowTerminal(true);
  };
  const handleTerminalClose = () => {
    setShowTerminal(false);
  };

  const lstyle = { margin: 10 };
  const bstyle = { padding: 20 };

  const optionTransformer = (option: string) => {
    const transfer = option === defaultCluster.cluster_name;
    return {
      disabled: transfer,
      option: transfer ? defaultCluster.cluster_disp : option,
    };
  };

  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>HCI Cluster Builder</b>
      </h3>
      <div className="jumbotron">
        <Form>
          {showAlert && (
            <Alert
              className="mb-2"
              variant="danger"
              onClose={() => setShowAlert(false)}
              dismissible
            >
              {errMsg?.join(" ") ?? "An unknown error."}
            </Alert>
          )}
          <Row>
            <Form.Group as={Col}>
              <Form.Label>Interface:</Form.Label>
              <Form.Select
                value={nicTreeId}
                onChange={(e) => {
                  e.preventDefault();
                  changeNic(Number(e.target.value));
                  chgBntStatus("dirty");
                }}
              >
                {nicTrees.map((nic, id) => {
                  return (
                    <option
                      key={nic.nic_name}
                      value={id}
                      disabled={id ? false : true}
                    >
                      {nic.nic_name}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Subnet:</Form.Label>
              <Form.Select
                value={subnetId}
                onChange={(e) => {
                  e.preventDefault();
                  changeNet(Number(e.target.value));
                  chgBntStatus("dirty");
                }}
              >
                {subnets.map((nic, id) => {
                  return (
                    <option key={nic.cidr} value={id}>
                      {nic.cidr}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Cluster:</Form.Label>
              <Form.Select
                value={clusterId ?? 0}
                onChange={(e) => {
                  e.preventDefault();
                  changeClu(Number(e.target.value));
                  chgBntStatus("dirty");
                }}
              >
                {clusters.map((nic, id) => {
                  const optDisplay = optionTransformer(nic.cluster_name);
                  return (
                    <option
                      key={nic.cluster_name}
                      value={id}
                      disabled={optDisplay.disabled}
                    >
                      {optDisplay.option}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            {curCluster && (
              <Form.Group as={Col}>
                <Form.Label>Action:</Form.Label>
                <div>
                  <Button
                    variant="outline-primary"
                    disabled={clusterId ? false : true}
                    onClick={(e) => {
                      e.preventDefault();
                      handleModalShow(clusterId);
                    }}
                  >
                    Assign Components to Selected HCI
                  </Button>
                </div>
              </Form.Group>
            )}
          </Row>
        </Form>
      </div>
      <Modal
        size="xl"
        backdrop="static"
        keyboard={false}
        show={showModal}
        onHide={handleModalClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            HCI Cluster Name: {curCluster?.cluster_name}
          </Modal.Title>
        </Modal.Header>
        {modalAlert && (
          <Alert
            className="mb-2"
            variant="danger"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {errMsg?.join(" ") ?? "An unknown error."}
          </Alert>
        )}
        <Modal.Body>
          <Form noValidate validated={validated}>
            <div>
              <h5>Storage Cluster:</h5>
              <br />
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Storage Type:
                    </Form.Label>
                    <Form.Select
                      value={curCluster?.storage_cluster_type ?? 0}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          storage_cluster_type: Number(e.target.value),
                        });
                        chgBntStatus("dirty");
                      }}
                    >
                      {clusterAreas.storageModules.map((t, i) => {
                        return (
                          <option
                            key={i.toString()}
                            value={i}
                            disabled={
                              t.moduleStatus > 0 || t.moduleName === "(None)"
                                ? false
                                : true
                            }
                          >
                            {t.moduleName}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Dashboard:
                    </Form.Label>
                    <Form.Select
                      value={curCluster?.storage_cluster_dashboard ?? 0}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          storage_cluster_dashboard: Number(e.target.value),
                        });
                        chgBntStatus("dirty");
                      }}
                    >
                      {clusterAreas.dashboardModules.map((t, i) => {
                        const storageType =
                          clusterAreas.storageModules[
                            curCluster.storage_cluster_type ?? 0
                          ].moduleName;
                        const compatible = t.compatibility
                          ? t.compatibility.includes(storageType.toLowerCase())
                          : true;
                        return (
                          <option
                            key={i.toString()}
                            value={i}
                            disabled={
                              (compatible && t.moduleStatus > 0) ||
                              t.moduleName === "(None)"
                                ? false
                                : true
                            }
                          >
                            {t.moduleName}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Target Share:
                    </Form.Label>
                    <Form.Control
                      required
                      type="input"
                      defaultValue={curCluster?.storage_cluster_share}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          storage_cluster_share: e.target.value,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col></Col>
              </Row>
            </div>
            <hr />
            <div>
              <h5>Compute Cluster:</h5>
              <br />
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Cluster Type:
                    </Form.Label>
                    <Form.Select
                      value={curCluster?.compute_cluster_type ?? 0}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          compute_cluster_type: Number(e.target.value),
                        });
                        chgBntStatus("dirty");
                      }}
                    >
                      {clusterAreas.computeModules.map((t, i) => {
                        return (
                          <option
                            key={i.toString()}
                            value={i}
                            disabled={
                              t.moduleStatus > 0 || t.moduleName === "(None)"
                                ? false
                                : true
                            }
                          >
                            {t.moduleName}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Dashboard:
                    </Form.Label>
                    <Form.Select
                      value={curCluster?.compute_cluster_dashboard ?? 0}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          compute_cluster_dashboard: Number(e.target.value),
                        });
                        chgBntStatus("dirty");
                      }}
                    >
                      {clusterAreas.dashboardModules.map((t, i) => {
                        const computeType =
                          clusterAreas.computeModules[
                            curCluster.compute_cluster_type ?? 0
                          ].moduleName;
                        const compatible = t.compatibility
                          ? t.compatibility.includes(computeType.toLowerCase())
                          : true;
                        return (
                          <option
                            key={i.toString()}
                            value={i}
                            disabled={
                              (compatible && t.moduleStatus > 0) ||
                              t.moduleName === "(None)"
                                ? false
                                : true
                            }
                          >
                            {t.moduleName}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
            <hr />
            <div>
              <h5>Load Balancer:</h5>
              <br />
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Balancer Type:
                    </Form.Label>
                    <Form.Select
                      value={curCluster?.balancer_cluster_type ?? 0}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          balancer_cluster_type: Number(e.target.value),
                        });
                        chgBntStatus("dirty");
                      }}
                    >
                      {clusterAreas.balancerModules.map((t, i) => {
                        const computeType =
                          clusterAreas.computeModules[
                            curCluster.compute_cluster_type ?? 0
                          ].moduleName;
                        const compatible = t.compatibility
                          ? t.compatibility.includes(computeType.toLowerCase())
                          : true;
                        return (
                          <option
                            key={i.toString()}
                            value={i}
                            disabled={
                              (compatible && t.moduleStatus > 0) ||
                              t.moduleName === "(None)"
                                ? false
                                : true
                            }
                          >
                            {t.moduleName}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Cluster v-IP:
                    </Form.Label>
                    <Form.Control
                      required
                      type="input"
                      defaultValue={curCluster?.balancer_cluster_vip}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          balancer_cluster_vip: e.target.value,
                        });
                        chgBntStatus("dirty");
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Cluster Protocol:
                    </Form.Label>
                    <Form.Select
                      value={curCluster?.balancer_protocol ?? "TCP"}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          balancer_protocol: e.target.value,
                        });
                        chgBntStatus("dirty");
                      }}
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Cluster Port:
                    </Form.Label>
                    <Form.Control
                      required
                      type="input"
                      defaultValue={curCluster?.balancer_port ?? "80"}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          balancer_port: e.target.value,
                        });
                        chgBntStatus("dirty");
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className=" col-sm-3 text-center">
                      Nic Binding:
                    </Form.Label>
                    <Form.Control
                      required
                      type="input"
                      defaultValue={curCluster?.peer_interface}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          peer_interface: e.target.value,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className="col-sm-3 text-center">
                      Peer Secret:
                    </Form.Label>
                    <Form.Control
                      required
                      type="input"
                      defaultValue={curCluster?.peer_pass_secret}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          peer_pass_secret: e.target.value,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
            <hr />
            <div>
              <h5>Change Control:</h5>
              <br />
              <Row>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className="col-sm-3 text-center">
                      Lock Cluster:
                    </Form.Label>
                    <Form.Check
                      type="switch"
                      id="cluster-lock-switch"
                      // label="Lock this cluster"
                      checked={curCluster?.is_locked}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          is_locked: e.target.checked,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-2 d-flex">
                    <Form.Label className="col-sm-3 text-center">
                      Build Auto-lock:
                    </Form.Label>
                    <Form.Check
                      type="switch"
                      id="cluster-lock-switch"
                      checked={curCluster?.build_auto_lock}
                      onChange={(e) => {
                        setCurCluster({
                          ...curCluster,
                          build_auto_lock: e.target.checked,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleModalSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="table" style={bstyle}>
        <Table striped bordered hover>
          <thead className="text-center align-middle">
            <tr>
              <th>
                <b>Host number</b>
              </th>
              <th>
                <b>IPv4 address</b>
              </th>
              <th>Host name</th>
              <th>
                <b>Storage Role</b>
              </th>
              <th>
                <b>Compute Role</b>
              </th>
              <th>
                <b>Balancer Role</b>
              </th>
            </tr>
          </thead>
          <tbody>
            {hostTuples.map((host: HostType, idx: number) => {
              return (
                <tr key={host.host} className="text-center">
                  <td>{idx + 1}</td>
                  <td>{host.ip}</td>
                  <td>{host.host}</td>
                  <td>
                    {host.storage_node && (
                      <Form.Select
                        key={host.ip + "@storageRole"}
                        id={idx.toString() + "@storageRole"}
                        value={host.storage_role ?? 0}
                        onChange={(e) => {
                          e.preventDefault();
                          changeNodeStorageRole(
                            parseInt(e.target.id),
                            Number(e.target.value)
                          );
                          chgBntStatus("dirty");
                        }}
                      >
                        {storageRoles.map((opt, id) => {
                          return (
                            <option
                              key={opt.role}
                              value={id}
                              disabled={opt.disabled ?? false}
                            >
                              {opt.role}
                            </option>
                          );
                        })}
                      </Form.Select>
                    )}
                  </td>
                  <td>
                    {host.compute_node && (
                      <Form.Select
                        key={host.ip + "@computeRole"}
                        id={idx.toString() + "@computeRole"}
                        value={host.compute_role ?? 0}
                        onChange={(e) => {
                          e.preventDefault();
                          changeNodeComputeRole(
                            parseInt(e.target.id),
                            Number(e.target.value)
                          );
                          chgBntStatus("dirty");
                        }}
                      >
                        {computeRoles.map((opt, id) => {
                          return (
                            <option
                              key={opt.role}
                              value={id}
                              // disabled={id ? false : true}
                            >
                              {opt.role}
                            </option>
                          );
                        })}
                      </Form.Select>
                    )}
                  </td>
                  <td>
                    {host.balancer_node && (
                      <Form.Select
                        key={host.ip + "@balancerRole"}
                        id={idx.toString() + "@balancerRole"}
                        value={host.balancer_role ?? 0}
                        onChange={(e) => {
                          e.preventDefault();
                          changeNodeBalancerRole(
                            parseInt(e.target.id),
                            Number(e.target.value)
                          );
                          chgBntStatus("dirty");
                        }}
                      >
                        {balancerRoles.map((opt, id) => {
                          return (
                            <option
                              key={opt.role}
                              value={id}
                              // disabled={opt.disabled ?? false}
                            >
                              {opt.role}
                            </option>
                          );
                        })}
                      </Form.Select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="jumbotron">
        <Form>
          <Button
            variant={
              bntStatus.save || curCluster.is_locked ? "secondary" : "primary"
            }
            style={lstyle}
            disabled={bntStatus.save || curCluster.is_locked}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.save) {
                saveAssignment();
              }
            }}
          >
            Save Config
          </Button>
          <Button
            variant={
              bntStatus.buld || curCluster.is_locked ? "secondary" : "primary"
            }
            style={lstyle}
            disabled={bntStatus.buld || curCluster.is_locked}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.buld) {
                buildCluster();
              }
            }}
          >
            Build Cluster
          </Button>
          <Button
            variant={
              bntStatus.dash || curCluster.is_locked ? "secondary" : "primary"
            }
            style={lstyle}
            disabled={bntStatus.dash || curCluster.is_locked}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.dash) {
                setupDashboard();
              }
            }}
          >
            Setup Dashboard
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/tent-clusters");
            }}
          >
            Active Clusters &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/tent-planner");
            }}
          >
            &#9665;&#x25C1; Resource Planner
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
      <TerminalModal
        showTerminal={showTerminal}
        handleTerminalClose={handleTerminalClose}
      />
    </div>
  );
}

export default TentBuilder;
