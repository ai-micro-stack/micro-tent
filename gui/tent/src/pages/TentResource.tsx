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
} from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import type {
  TentInterface,
  TentSubnet,
  ClusterType,
  HostType,
} from "@/types/Tent";
import { unknownNic } from "@/types/Tent";
import {
  getActiveHosts,
  getActiveClusters,
  getActiveSubnets,
} from "@/utils/activeResource";
import { storeGuiContext, fetchGuiContext } from "@/utils/currentContext";

function TentResource() {
  const bntInitState = {
    save: false,
    name: true,
    dnsr: true,
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
  const [namePrefix, setNamePrefix] = useState("host");

  const [clusters, setClusters] = useState<ClusterType[]>([]);
  // const [curCluster, setCurCluster] = useState<ClusterType>(emptyCluster);

  const [hostTuples, setHostTuples] = useState<HostType[]>([]);

  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);

  useEffect(
    () => {
      (() => {
        axiosInstance
          .get("/tentresource/hosts")
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
        setClusterId(curContext.clusterId);
      } else setSubnetId(0);
    },
    // eslint-disable-next-line
    [subnets, subnetId]
  );

  useEffect(
    () => {
      if (clusterId === null || clusters.length > clusterId) {
        const activeHosts = getActiveHosts(
          "finder",
          nicTrees,
          nicTreeId,
          subnetId,
          null // all clusters
        );
        setHostTuples(activeHosts.Hosts);

        // setCurCluster(activeClusters.Clusters[clusterId]);
      }
    },
    // eslint-disable-next-line
    [clusters, clusterId]
  );

  const toggleHandler = (picked: number) => {
    if ((picked ?? -1) !== -1) {
      hostTuples[picked].is_active = !hostTuples[picked].is_active;
    } else {
      const toggledAllAs = hostTuples.filter((h) => {
        return h.cluster_node !== true && h.ping && h.ssh;
      })[0].is_active
        ? false
        : true;
      setHostTuples(
        hostTuples.map((h) => {
          return {
            ...h,
            is_active:
              h.cluster_node !== true && h.ping && h.ssh
                ? toggledAllAs
                : h.is_active,
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
  // const changeClu = (targetClu: number) => {
  //   setCurContext({ ...curContext, clusterId: targetClu });
  //   storeGuiContext("tent.context",{ ...curContext, clusterId: targetClu });
  //   setClusterId(targetClu);
  //   chgBntStatus("dirty");

  const resourceScan = () => {
    setSpinning(true);
    axiosInstance
      .post("/tentresource/scan", {
        subnet_id: subnets[subnetId].id,
        subnet_cidr: subnets[subnetId].cidr,
        subnet_prefix: namePrefix, //subnets[subnetId].prefix,
      })
      .then(() => {
        setRefresh(refresh + 1);
        setSpinning(false);
      })
      .catch((error) => {
        setSpinning(false);
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to scan resources ", error);
      });
  };

  const resourceSave = () => {
    axiosInstance
      .post("/tentresource/save", {
        cluster_id: subnets[subnetId].Clusters[0].id,
        Hosts: hostTuples.filter((h) => {
          return h.cluster_node !== true;
        }),
      })
      .then(() => {
        chgBntStatus("save");
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

  const updateHostName = () => {
    const confirmHostname = window.confirm(
      `The hostname of the picked hosts will be changed as the proposal. No impacting to the hosts unselected or already in use.`
    );
    if (!confirmHostname) return;
    // chgBntStatus("none");
    axiosInstance
      .post("/tentresource/name", {})
      .then(() => {
        chgBntStatus("name");
      })
      .catch((error) => {
        chgBntStatus("name");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to register DNS records ", error);
      });
  };

  const updateHostFile = () => {
    const confirmHostIp = window.confirm(
      `The OS hosts file of the selected hosts will be updated. Make sure these host IPs are static. No impacting to the hosts unselected or already in use.`
    );
    if (!confirmHostIp) return;
    // chgBntStatus("none");
    axiosInstance
      .post("/tentresource/dnsr", {})
      .then(() => {
        chgBntStatus("dnsr");
        setRefresh(refresh + 1);
      })
      .catch((error) => {
        chgBntStatus("dnsr");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to register DNS records ", error);
      });
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          save: true,
          name: true,
          dnsr: true,
          next: true,
        });
        break;
      case "save":
        setSpinning(false);
        setBntStatus({
          save: true,
          name: false,
          dnsr: true,
          next: false,
        });
        break;
      case "name":
        setSpinning(false);
        setBntStatus({
          ...bntInitState,
          save: true,
          name: true,
          dnsr: false,
          next: false,
        });
        break;
      case "dnsr":
        setSpinning(false);
        setBntStatus({
          ...bntInitState,
          save: true,
          name: true,
          dnsr: true,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          save: false,
          name: true,
          dnsr: true,
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
        <b>Resource Finder</b>
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
                // id="dhcpInterface"
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
                // id="dhcpInterface"
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
              <Form.Label>Assign Hostname prefix:</Form.Label>
              <Form.Control
                type="input"
                defaultValue={namePrefix}
                onChange={(e) => {
                  setNamePrefix(e.target.value);
                  chgBntStatus("dirty");
                }}
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Action:</Form.Label>
              <div>
                <Button
                  variant="outline-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    resourceScan();
                  }}
                >
                  Find Resources
                </Button>
              </div>
            </Form.Group>
          </Row>
        </Form>
      </div>
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
              <th>Proposed hostname</th>
              <th>
                <b>Ping-able</b>
              </th>
              <th>
                <b>SSH-able</b>
              </th>
              <th>
                <Button variant="link" onClick={() => toggleHandler(-1)}>
                  <b>Toggle all ( in/out )</b>
                </Button>
              </th>
              <th>
                <b>Already in use</b>
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
                  <td>{host.ping ? "✓" : " "}</td>
                  <td>{host.ssh ? "✓" : " "}</td>
                  <td className="text-center">
                    <ToggleButton
                      key={host.ip}
                      id={idx.toString()}
                      type="checkbox"
                      variant={
                        host.cluster_node
                          ? "outline-danger"
                          : host.is_active
                          ? "outline-success"
                          : "outline-primary"
                      }
                      name="checkbox"
                      value={host.ip}
                      checked={host.is_active}
                      disabled={host.cluster_node}
                      onChange={(e) =>
                        toggleHandler(parseInt(e.currentTarget.id))
                      }
                    ></ToggleButton>
                  </td>
                  <td>{host.cluster_node ? "✓" : " "}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="jumbotron">
        <Form>
          <Button
            variant={bntStatus.save ? "secondary" : "primary"}
            style={lstyle}
            // disabled={clusterId ? true : bntStatus.save}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.save) {
                resourceSave();
              }
            }}
          >
            Save Resources
          </Button>
          <Button
            variant={bntStatus.name ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.name}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.name) {
                updateHostName();
              }
            }}
          >
            Apply Host Names
          </Button>{" "}
          <Button
            variant={bntStatus.dnsr ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.dnsr}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.dnsr) {
                updateHostFile();
              }
            }}
          >
            Update Hosts Files
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/tent-planner");
            }}
          >
            Resource Planner &#9655;&#x25B7;
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
    </div>
  );
}

export default TentResource;
