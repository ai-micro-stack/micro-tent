import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Row,
  Col,
  Table,
  Button,
  ToggleButton,
  Alert,
  Modal,
} from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import type {
  TentInterface,
  TentSubnet,
  ClusterType,
  HostType,
} from "@/types/Tent";
import { unknownNic, emptyCluster } from "@/types/Tent";
import { localStorageTypes, localComputeTypes } from "@/types/Tent";
import {
  getActiveHosts,
  getActiveClusters,
  getActiveSubnets,
} from "@/utils/activeResource";
import { storeGuiContext, fetchGuiContext } from "@/utils/currentContext";

function TentPlanner() {
  const bntInitState = {
    save: true,
    dnsr: true,
    etcf: true,
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
  const [storageTypes, setStorageTypes] = useState(localStorageTypes);
  const [computeTypes, setComputeTypes] = useState(localComputeTypes);

  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  useEffect(
    () => {
      (() => {
        setStorageTypes(localStorageTypes);
        setComputeTypes(localComputeTypes);
        axiosInstance
          .get("/tentplan/data")
          .then(({ data }) => {
            setNicTrees([unknownNic, ...data.Interfaces]);
            setNicTreeId(curContext.nicTreeId);
          })
          .catch((error) =>
            console.error("Get resource context failed ", error)
          );
      })();
    },
    // eslint-disable-next-line
    [refresh]
  );

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
        if (activeClusters.Clusters[curContext.clusterId ?? 0]) {
          setClusterId(curContext.clusterId ?? 0);
        } else {
          setClusterId(activeClusters.clusterId);
        }
      } else setSubnetId(0);
    },
    // eslint-disable-next-line
    [subnets, subnetId]
  );

  useEffect(
    () => {
      if (clusterId === null || clusters.length > clusterId) {
        const activeHosts = getActiveHosts(
          "planner",
          nicTrees,
          nicTreeId,
          subnetId,
          clusterId
        );
        setHostTuples(activeHosts.Hosts);

        setCurCluster(
          nicTrees[nicTreeId].Subnets[subnetId].Clusters[clusterId ?? 0]
        );
      }
    },
    // eslint-disable-next-line
    [clusters, clusterId]
  );

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
    setCurCluster(emptyCluster);
    setModalAlert(false);
    setValidated(false);
    setShowModal(false);
  };

  const handleModalSave = () => {
    const postRoute = curCluster.id ? "update" : "create";
    axiosInstance
      .post(
        `/tentplan/${postRoute}`,
        { ...curCluster, subnet_id: subnets[subnetId].id },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
      .then(({ data }) => {
        setShowModal(false);

        //auto change current cluster to the new added
        if (postRoute === "create") {
          const newCluster = data;
          axiosInstance
            .get("/tentplan/data")
            .then(({ data }) => {
              setNicTrees([unknownNic, ...data.Interfaces]);
              setSubnets(data.Interfaces[curContext.nicTreeId - 1].Subnets);
              const activeClusters =
                data.Interfaces[curContext.nicTreeId - 1].Subnets[
                  curContext.subnetId
                ].Clusters;
              setClusters(activeClusters);
              let newCreated = 0;
              for (let i = 0; i <= activeClusters.length; i++) {
                if (clusters[i] === newCluster.id) {
                  newCreated = i;
                  break;
                }
              }
              setCurContext({ ...curContext, clusterId: newCreated });
              storeGuiContext("tent.context", {
                ...curContext,
                clusterId: newCreated,
              });
              setClusterId(newCreated);
            })
            .catch((error) =>
              console.error("Get resource context failed ", error)
            );
        }
      })
      .catch((error) => {
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setModalAlert(true);
        console.error("Failed to send the member data to server.", error);
      });
  };

  const toggleClusterNode = (picked: number) => {
    if (!clusterId) return;
    if ((picked ?? -1) !== -1) {
      hostTuples[picked].cluster_node = !hostTuples[picked].cluster_node;
    } else {
      const toggledAllAs = hostTuples[0].cluster_node ? false : true;
      setHostTuples(
        hostTuples.map((h) => {
          return { ...h, cluster_node: toggledAllAs };
        })
      );
    }
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };

  const toggleBalancerNode = (picked: number) => {
    if ((picked ?? -1) !== -1) {
      hostTuples[picked].balancer_node = !hostTuples[picked].balancer_node;
    } else {
      const toggledAllAs = hostTuples.filter((h) => {
        return h.cluster_node === true && h.is_active;
      })[0].balancer_node
        ? false
        : true;
      setHostTuples(
        hostTuples.map((h) => {
          return {
            ...h,
            balancer_node:
              h.cluster_node === true && h.is_active
                ? toggledAllAs
                : h.balancer_node,
          };
        })
      );
    }
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };

  const toggleComputeNode = (picked: number) => {
    if ((picked ?? -1) !== -1) {
      hostTuples[picked].compute_node = !hostTuples[picked].compute_node;
    } else {
      const toggledAllAs = hostTuples.filter((h) => {
        return h.cluster_node === true && h.is_active;
      })[0].compute_node
        ? false
        : true;
      setHostTuples(
        hostTuples.map((h) => {
          return {
            ...h,
            compute_node:
              h.cluster_node === true && h.is_active
                ? toggledAllAs
                : h.compute_node,
          };
        })
      );
    }
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };

  const toggleStorageNode = (picked: number) => {
    if ((picked ?? -1) !== -1) {
      hostTuples[picked].storage_node = !hostTuples[picked].storage_node;
    } else {
      const toggledAllAs = hostTuples.filter((h) => {
        return h.cluster_node === true && h.is_active;
      })[0].storage_node
        ? false
        : true;
      setHostTuples(
        hostTuples.map((h) => {
          return {
            ...h,
            storage_node:
              h.cluster_node === true && h.is_active
                ? toggledAllAs
                : h.storage_node,
          };
        })
      );
    }
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };

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

  const changeHostStorage = (host_id: number, localStorage: string) => {
    console.log(host_id + "." + localStorage);
    setHostTuples(
      hostTuples.map((h) => {
        return {
          ...h,
          local_storage: h.id === host_id ? localStorage : h.local_storage,
        };
      })
    );
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };
  const changeStorageType = (host_id: number, storageType: number) => {
    console.log(host_id + "." + storageType);
    setHostTuples(
      hostTuples.map((h) => {
        return {
          ...h,
          local_storage_type:
            h.id === host_id ? storageType : h.local_storage_type,
        };
      })
    );
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };
  const changeHostCompute = (host_id: number, computeType: number) => {
    console.log(host_id + "." + computeType);
    setHostTuples(
      hostTuples.map((h) => {
        return {
          ...h,
          local_compute_type:
            h.id === host_id ? computeType : h.local_compute_type,
        };
      })
    );
    setBntStatus({
      ...bntStatus,
      save: false,
    });
  };

  const saveAllocations = () => {
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
        console.error("Failed to save the resources.", error);
      });
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          save: true,
          dnsr: true,
          etcf: true,
          prev: true,
          next: true,
        });
        break;
      case "save":
        setSpinning(false);
        setBntStatus({
          save: true,
          dnsr: true,
          etcf: true,
          prev: false,
          next: false,
        });
        break;
      case "dnsr":
        setSpinning(false);
        setBntStatus({
          save: true,
          dnsr: true,
          etcf: true,
          prev: false,
          next: false,
        });
        break;
      case "etcf":
        setSpinning(false);
        setBntStatus({
          save: true,
          dnsr: true,
          etcf: true,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          save: false,
          dnsr: true,
          etcf: true,
          prev: true,
          next: true,
        });
        break;
    }
  };

  const lstyle = { margin: 10 };
  const bstyle = { padding: 20 };

  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>HCI Cluster Planner</b>
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
                  return (
                    <option
                      key={nic.cluster_name}
                      value={id}
                      //disabled={id ? false : true}
                    >
                      {id
                        ? nic.cluster_name + " (list with free hosts)"
                        : "(All free hosts in subnet)"}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Action:</Form.Label>
              <div>
                <Button
                  variant="outline-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleModalShow(clusterId);
                  }}
                >
                  {clusterId ? "Edit" : "Create"} Cluster Stub
                </Button>
              </div>
            </Form.Group>
          </Row>
        </Form>
      </div>
      <Modal
        size="lg"
        backdrop="static"
        keyboard={false}
        show={showModal}
        onHide={handleModalClose}
      >
        <Modal.Header closeButton>
          <Modal.Title>HCI Cluster Stub</Modal.Title>
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
            <br />
            <h5>Cluster General Information:</h5>
            <br />
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Cluster Name:
              </Form.Label>
              <Form.Control
                required
                type="input"
                defaultValue={curCluster?.cluster_name}
                onChange={(e) => {
                  setCurCluster({
                    ...curCluster,
                    cluster_name: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Cluster Note:
              </Form.Label>
              <Form.Control
                required
                type="input"
                defaultValue={curCluster?.cluster_note}
                onChange={(e) => {
                  setCurCluster({
                    ...curCluster,
                    cluster_note: e.target.value,
                  });
                }}
              />
            </Form.Group>
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
            <br />
            <br />
            <h5>Member Host Resource Defaults:</h5>
            <br />
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Default Compute:
              </Form.Label>
              <Form.Select
                value={curCluster?.local_compute_type ?? 0}
                onChange={(e) => {
                  setCurCluster({
                    ...curCluster,
                    local_compute_type: parseInt(e.target.value),
                  });
                }}
              >
                {computeTypes.map((t, i) => {
                  return (
                    <option
                      key={i.toString()}
                      value={i}
                      // disabled={i ? false : true}
                    >
                      {t}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Local Storage(s):
              </Form.Label>
              <Form.Control
                required
                type="input"
                defaultValue={curCluster?.local_storage_default}
                onChange={(e) => {
                  setCurCluster({
                    ...curCluster,
                    local_storage_default: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Local Storage Type:
              </Form.Label>
              <Form.Select
                value={curCluster?.local_storage_type ?? 0}
                onChange={(e) => {
                  setCurCluster({
                    ...curCluster,
                    local_storage_type: parseInt(e.target.value),
                  });
                }}
              >
                {storageTypes.map((t, i) => {
                  return (
                    <option
                      key={i.toString()}
                      value={i}
                      // disabled={i ? false : true}
                    >
                      {t}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
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
              <th rowSpan={2}>
                <b>Host number</b>
              </th>
              <th rowSpan={2}>
                <b>IPv4 address</b>
              </th>
              <th rowSpan={2}>Host name</th>
              {/* <th>Availability</th> */}
              <th rowSpan={2} style={{ width: "10%" }}>
                <b>HCI Member</b>
                <Button variant="link" onClick={() => toggleClusterNode(-1)}>
                  <b>( All in/out )</b>
                </Button>
              </th>
              <th rowSpan={2}></th>
              <th colSpan={3}>
                <b>Storage Cluster</b>
              </th>
              <th colSpan={2}>
                <b>Compute Cluster</b>
              </th>
              <th rowSpan={2} style={{ width: "10%" }}>
                <b>Balancer Cluster</b>
                <Button variant="link" onClick={() => toggleBalancerNode(-1)}>
                  <b>( All in/out )</b>
                </Button>
              </th>
            </tr>
            <tr>
              <th style={{ width: "10%" }}>
                <b>Storage node</b>
                <Button variant="link" onClick={() => toggleStorageNode(-1)}>
                  <b>( All in/out )</b>
                </Button>
              </th>
              <th style={{ width: "10%" }}>
                <b>Local Storage</b>
              </th>
              <th style={{ width: "10%" }}>
                <b>Storage type</b>
              </th>
              <th style={{ width: "10%" }}>
                <b>Compute node</b>
                <Button variant="link" onClick={() => toggleComputeNode(-1)}>
                  <b>( All in/out )</b>
                </Button>
              </th>
              {/* <th style={{ width: "10%" }}>
                <b>Request Taker</b>
                <Button variant="link" onClick={() => toggleComputeNode(-1)}>
                  <b>( All in/out )</b>
                </Button>
              </th> */}
              <th>
                <b>Compute type</b>
              </th>
              {/* <th style={{ width: "10%" }}>
                <b>Balancer node</b>
                <Button variant="link" onClick={() => toggleBalancerNode(-1)}>
                  <b>( All in/out )</b>
                </Button>
              </th>
              <th style={{ width: "10%" }}>
                <b>Load Taker</b>
              </th> */}
            </tr>
          </thead>
          <tbody>
            {hostTuples.map((host: HostType, idx: number) => {
              return (
                <tr key={host.host} className="text-center">
                  <td>{idx + 1}</td>
                  <td>{host.ip}</td>
                  <td>{host.host}</td>
                  {/* <td>{host.is_active ? "✓" : " "}</td> */}
                  <td className="text-center">
                    <ToggleButton
                      key={host.ip + "@cluster"}
                      id={idx.toString() + "@cluster"}
                      type="checkbox"
                      variant={
                        host.cluster_node
                          ? "outline-success"
                          : "outline-primary"
                      }
                      name="checkbox"
                      value={host.ip}
                      checked={host.cluster_node}
                      onChange={(e) =>
                        toggleClusterNode(parseInt(e.currentTarget.id))
                      }
                    ></ToggleButton>
                  </td>
                  <td></td>
                  <td>
                    {host.cluster_node && (
                      <ToggleButton
                        key={host.ip + "@storage"}
                        id={idx.toString() + "@storage"}
                        type="checkbox"
                        variant={
                          host.storage_node
                            ? "outline-success"
                            : "outline-primary"
                        }
                        name="checkbox"
                        value={host.ip}
                        checked={host.storage_node}
                        onChange={(e) =>
                          toggleStorageNode(parseInt(e.currentTarget.id))
                        }
                      ></ToggleButton>
                    )}
                  </td>
                  <td>
                    {host.storage_node && (
                      <Form.Control
                        className="border border-1 ps-2"
                        value={
                          host.local_storage ??
                          curCluster?.local_storage_default ??
                          0
                        }
                        onChange={(e) => {
                          changeHostStorage(host.id, e.target.value.toString());
                        }}
                      />
                    )}
                  </td>
                  <td>
                    {host.storage_node && (
                      <Form.Select
                        value={
                          host?.local_storage_type ??
                          curCluster?.local_storage_type ??
                          0
                        }
                        onChange={(e) => {
                          changeStorageType(host.id, parseInt(e.target.value));
                        }}
                      >
                        {storageTypes.map((t, i) => {
                          return (
                            <option
                              key={i.toString()}
                              value={i}
                              // disabled={true}
                            >
                              {t}
                            </option>
                          );
                        })}
                      </Form.Select>
                    )}
                  </td>
                  <td>
                    {host.cluster_node && (
                      <ToggleButton
                        key={host.ip + "@compute"}
                        id={idx.toString() + "@compute"}
                        type="checkbox"
                        variant={
                          host.compute_node
                            ? "outline-success"
                            : "outline-primary"
                        }
                        name="checkbox"
                        value={host.ip}
                        checked={host.compute_node}
                        onChange={(e) =>
                          toggleComputeNode(parseInt(e.currentTarget.id))
                        }
                      ></ToggleButton>
                    )}
                  </td>
                  {/* <td>
                    {host.compute_node && (
                      <Form.Check // prettier-ignore
                        type="checkbox"
                        id={idx.toString() + "@compute"}
                        // label={`requst taker`}
                        checked={host.compute_node}
                        onChange={(e) =>
                          toggleComputeNode(parseInt(e.currentTarget.id))
                        }
                      />
                    )}
                  </td> */}
                  <td>
                    {host.compute_node && (
                      <Form.Select
                        value={
                          host?.local_compute_type ??
                          curCluster?.local_compute_type ??
                          0
                        }
                        onChange={(e) => {
                          changeHostCompute(host.id, parseInt(e.target.value));
                        }}
                      >
                        {computeTypes.map((t, i) => {
                          return (
                            <option
                              key={i.toString()}
                              value={i}
                              // disabled={true}
                            >
                              {t}
                            </option>
                          );
                        })}
                      </Form.Select>
                    )}
                  </td>
                  <td>
                    {host.cluster_node && (
                      <ToggleButton
                        key={host.ip + "@balancer"}
                        id={idx.toString() + "@balancer"}
                        type="checkbox"
                        variant={
                          host.balancer_node
                            ? "outline-success"
                            : "outline-primary"
                        }
                        name="checkbox"
                        value={host.ip}
                        checked={host.balancer_node}
                        onChange={(e) =>
                          toggleBalancerNode(parseInt(e.currentTarget.id))
                        }
                      ></ToggleButton>
                    )}
                  </td>
                  {/* <td>(Load Taker)</td> */}
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
                saveAllocations();
              }
            }}
          >
            Save Allocation
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/tent-builder");
            }}
          >
            Cluster Builder &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/tent-resource");
            }}
          >
            &#9665;&#x25C1; Resource Finder
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
    </div>
  );
}

export default TentPlanner;
