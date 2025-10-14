import { useEffect, useState, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Table, Button, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
// import type { moduleType } from "@/types/Addon";
import type { tentModuleAreas } from "@/types/Tent";
import { tentEmptyAreas } from "@/types/Tent";
function TentClusters() {
  const bntInitState = {
    updt: true,
    prev: false,
    next: false,
  };
  interface Tuple {
    cluster: {
      admin_subnet: string;
      cluster_id: string;
      balancer_cluster_vip: string;
      balancer_protocol?: string;
      balancer_port?: string;
      cluster_name: string;
      cluster_nodes: number;
      compute_cluster_type: string;
      compute_nodes: number;
      storage_cluster_type: string;
      storage_nodes: number;
      cluster_status: string;
      nodeRef: React.ReactNode;
    };
  }

  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [clusterStatus, setClusterStatus] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);
  const [refresh, setRefresh] = useState(0);
  const [clusterAreas, setClusterAreas] =
    useState<tentModuleAreas>(tentEmptyAreas);

  useEffect(
    () => {
      axiosInstance
        .get("/tentbuild/modules")
        .then(({ data }) => {
          setClusterAreas({ ...data });
        })
        .catch((error) =>
          console.error("Get cluster config data failed ", error)
        );
    },
    // eslint-disable-next-line
    [refresh]
  );

  useEffect(
    () => {
      setSpinning(true);
      let existedClusters = [];
      axiosInstance
        .get("/tentplan/tents")
        .then(({ data }) => {
          existedClusters = data.clusters.map(
            (tuple: {
              admin_subnet: string;
              cluster_id: number;
              balancer_cluster_vip: string;
              balancer_protocol?: string;
              balancer_port?: string;
              cluster_name: string;
              cluster_nodes: number;
              compute_cluster_type: number;
              compute_nodes: number;
              storage_cluster_type?: number;
              storage_nodes: number;
              cluster_status?: boolean;
            }) => {
              return {
                cluster: {
                  admin_subnet: tuple.admin_subnet,
                  cluster_id: tuple.cluster_id.toString(),
                  balancer_cluster_vip: tuple.balancer_cluster_vip,
                  balancer_protocol: tuple.balancer_protocol,
                  balancer_port: tuple.balancer_port,
                  cluster_name: tuple.cluster_name,
                  cluster_nodes: tuple.cluster_nodes,
                  compute_cluster_type:
                    clusterAreas.computeModules[tuple.compute_cluster_type ?? 0]
                      ?.moduleName,
                  compute_nodes: tuple.compute_nodes,
                  storage_cluster_type:
                    clusterAreas.storageModules[tuple.storage_cluster_type ?? 0]
                      ?.moduleName,
                  storage_nodes: tuple.storage_nodes,
                  cluster_status:
                    tuple.cluster_status === true
                      ? "✓ (vIP ping-able)"
                      : tuple.cluster_status === false
                      ? "✗ (Not reachable)"
                      : "",
                  nodeRef: tuple.compute_cluster_type ? createRef() : null,
                },
              };
            }
          );
          setClusterStatus(existedClusters);
          setSpinning(false);
        })
        .catch((error) => {
          setSpinning(false);
          console.error("Get Rack Service failed ", error);
        });
    },
    // eslint-disable-next-line
    [clusterAreas]
  );

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          updt: true,
          prev: false,
          next: false,
        });
        break;
      case "updt":
        setSpinning(false);
        setBntStatus({
          updt: true,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          updt: false,
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
        <b>Active HCI Clusters</b>
      </h3>
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
      <div className="table" style={bstyle}>
        <Table striped bordered hover>
          <thead className="text-center align-middle">
            <tr>
              <th>
                <b>Admin Subnet</b>
              </th>
              <th>
                <b>Cluster Name</b>
              </th>
              <th>
                <b>Cluster Virt-IP</b>
              </th>
              <th>
                <b>Total Members</b>
              </th>
              <th>
                <b>Compute Cluster</b>
              </th>
              <th>
                <b>Compute Nodes</b>
              </th>
              <th>
                <b>Storage Cluster</b>
              </th>
              <th>
                <b>Storage Nodes</b>
              </th>
              <th>
                <b>Cluster Status</b>
              </th>
            </tr>
          </thead>
          <tbody>
            {clusterStatus.map((tuple: Tuple) => {
              const { cluster } = tuple;
              return (
                <tr key={cluster.cluster_id} className="text-center">
                  <td>{cluster.admin_subnet}</td>
                  <td>{cluster.cluster_name}</td>
                  <td>{cluster.balancer_cluster_vip}</td>
                  <td>{cluster.cluster_nodes}</td>
                  <td>{cluster.compute_cluster_type}</td>
                  <td>{cluster.compute_nodes}</td>
                  <td>{cluster.storage_cluster_type}</td>
                  <td>{cluster.storage_nodes}</td>
                  <td>{cluster.cluster_status}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="jumbotron">
        {/* fixed-bottom */}
        <Form>
          <Button
            // variant={bntStatus.updt ? "secondary" : "primary"}
            style={lstyle}
            // disabled={bntStatus.updt}
            onClick={(e) => {
              e.preventDefault();
              chgBntStatus("updt");
              setErrMsg([]);
              setRefresh(refresh + 1);
              // window.location.reload();
            }}
          >
            Page Refresh
          </Button>
          {/* <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/about-up");
            }}
          >
            About Us &#9655;&#x25B7;
          </Button> */}
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/tent-builder");
            }}
          >
            &#9665;&#x25C1; Cluster Builder
          </Button>
        </Form>
      </div>
      {spinning && <Loading />}
    </div>
  );
}

export default TentClusters;
