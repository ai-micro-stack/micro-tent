import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Table, Button, Alert } from "react-bootstrap";
import Collapse from "react-bootstrap/Collapse";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import FileUploader from "@/components/FileUploader";
import type { FileChange, FileChanges } from "@/types/Event";
import fileNameParser from "@/utils/fileNameParser";

import { TerminalModal } from "@/components/WebTerminal";

type PluginProps = {
  channelParam?: string;
  allowedTypes?: string[];
  managerTitle?: string;
};

function PluginManager({
  channelParam,
  allowedTypes,
  managerTitle,
}: PluginProps) {
  const bntInitState = {
    mount: false,
    prev: false,
    next: false,
  };
  type Plugin = {
    fullName: string;
    pluginName: string;
    pluginType: string;
    pluginFile: string;
    fileExists: boolean;
    mountExists: boolean;
    foundExists: boolean;
    nodeRef: React.ReactNode;
  };
  type PluginArea = {
    pluginType: string;
    pluginList: Plugin[];
  };

  type TrackerEvent = { [key: string]: string };
  type TrackerEvents = { [key: string]: TrackerEvent[] };
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [pluginAreas, setPluginAreas] = useState<PluginArea[]>([]);
  const [changeTracker, setChangeTracker] = useState({});
  const [fileChangeEvent, setFileChangeEvent] = useState({
    file: "",
    change: "",
  });
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);
  const [openStates, setOpenStates] = useState<string[]>([]);

  const [showTerminal, setShowTerminal] = useState(false);

  const toggleOpen = (id: string) => {
    if (openStates.includes(id)) {
      setOpenStates(openStates.filter((rowId) => rowId !== id));
    } else {
      setOpenStates([...openStates, id]);
    }
  };

  useEffect(
    () => {
      setChangeTracker(
        JSON.parse(localStorage.getItem(`${channelParam}`) ?? "{}")
      );
      getPluginContext();
      eventAggregator(fileChangeEvent);
    },
    // eslint-disable-next-line
    [fileChangeEvent]
  );

  const eventAggregator = (change: FileChange) => {
    if (!change.file) {
      return;
    }
    const tracker: TrackerEvents = { ...changeTracker };
    // type TrackerKey = keyof typeof tracker;
    const fileParts = fileNameParser(change.file);
    const eventName: string = fileParts.name;
    const fileEvent = { [fileParts.ext]: change.change };
    const existedEvents = tracker[eventName] || [];
    const updatedEvents: TrackerEvent[] = [...existedEvents, fileEvent];
    tracker[eventName] = updatedEvents;
    setChangeTracker(tracker);
    localStorage.setItem(`${channelParam}`, JSON.stringify(tracker));
    chgBntStatus("dirty");
  };

  const chgBntStatus = (status: string) => {
    switch (status) {
      case "none":
        setSpinning(true);
        setBntStatus({
          mount: true,
          prev: false,
          next: false,
        });
        break;
      case "mount":
        setSpinning(false);
        setBntStatus({
          mount: true,
          prev: false,
          next: false,
        });
        break;
      case "dirty":
      default:
        setSpinning(false);
        setBntStatus({
          mount: false,
          prev: true,
          next: true,
        });
        break;
    }
  };

  const getPluginContext = () => {
    const stackPlugin = channelParam ? `/${channelParam}` : "";
    axiosInstance
      .get(`/stackplugin/type${stackPlugin}`)
      .then(({ data }) => {
        setPluginAreas(data);
      })
      .catch((error) => console.error("Get stack plugins failed ", error));
  };

  const removePlugin = (file: string) => {
    const stackPlugin = channelParam ? `/${channelParam}` : "";
    const fileName = `${file}`;
    const confirmDelete = window.confirm(`Delete "${fileName}" ?`);
    if (confirmDelete) {
      axiosInstance
        .delete(`/stackupload/delete${stackPlugin}`, {
          headers: {
            "x-file-name": fileName,
          },
        })
        .then(() => {
          getPluginContext();
          setFileChangeEvent({ file: file, change: "-" });
        })
        .catch((error) => {
          setErrMsg([
            error.message,
            error.status === 403
              ? "--- You don't have permission to make this operation."
              : "",
          ]);
          setShowAlert(true);
          console.error("Delete iso files failed ", error);
        });
    }
  };

  const pluginMount = (changeTracker: FileChanges) => {
    chgBntStatus("none");
    const stackPlugin = channelParam ? `/${channelParam}` : "";
    const changes = JSON.stringify(changeTracker);
    axiosInstance
      .post(`/stackplugin/mount${stackPlugin}`, changes, {
        // headers: {
        //   "Content-Type": "application/x-binary",
        //   "Access-Control-Allow-Origin": "*",
        // },
      })
      .then(() => {
        chgBntStatus("mount");
        setFileChangeEvent({ file: "", change: "img" });
        setChangeTracker({});
        localStorage.removeItem(`${channelParam}`);
      })
      // .then(() => {
      //   handleTerminalShow();
      // })
      .catch((error) => {
        chgBntStatus("mount");
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
        console.error("Failed to mount iso files ", error);
      });
  };

  // const handleTerminalShow = () => {
  //   setShowTerminal(true);
  // };
  const handleTerminalClose = () => {
    setShowTerminal(false);
  };

  const lstyle = { margin: 10 };
  const bstyle = { padding: 20 };
  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>{managerTitle}</b>
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
      <FileUploader
        completeNotifier={setFileChangeEvent}
        channelParam={channelParam}
        allowedTypes={allowedTypes}
        // receiverUrl={uploaderBackend}
      />
      <div className="table" style={bstyle}>
        <Table striped bordered hover>
          <thead className="text-center align-middle">
            <tr>
              <th></th>
              <th>
                <b>Plugin Category</b>
              </th>
            </tr>
          </thead>
          <tbody>
            {pluginAreas.map((area) => (
              <React.Fragment key={area.pluginType}>
                <tr>
                  <td>
                    {area.pluginList && (
                      <Button
                        style={{ width: "40px" }}
                        onClick={() => toggleOpen(area.pluginType)}
                        aria-controls={`collapse-${area.pluginType}`}
                        aria-expanded={openStates.includes(area.pluginType)}
                      >
                        {openStates.includes(area.pluginType) ? "-" : "+"}
                      </Button>
                    )}
                  </td>
                  <td className="text-center">{area.pluginType}</td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Collapse in={openStates.includes(area.pluginType)}>
                      <div id={`collapse-content-${area.pluginType}`}>
                        <Table size="sm" className="mt-2">
                          <tbody>
                            <tr className="text-center">
                              <th>
                                <b>Plugin Name</b>
                              </th>
                              <th>
                                <b>Plugin Type</b>
                              </th>
                              <th>
                                <b>User Uploaded Plugin</b>
                              </th>
                              <th>
                                <b>Plugin Mounted</b>
                              </th>
                              <th>
                                <b>Plugin Loadable</b>
                              </th>
                            </tr>
                            {area.pluginList
                              .filter(
                                (tuple: Plugin) =>
                                  tuple.fileExists || tuple.mountExists
                              )
                              .map((tuple: Plugin) => {
                                return (
                                  <tr
                                    key={tuple.fullName}
                                    className="text-center"
                                  >
                                    <td>{tuple.pluginName}</td>
                                    <td>{tuple.pluginType}</td>
                                    <td>
                                      <>
                                        {tuple.fileExists
                                          ? tuple.pluginFile
                                          : ""}
                                        {tuple.fileExists && (
                                          <Button
                                            className="remove-btn float-end"
                                            variant="danger"
                                            size="sm"
                                            onClick={() =>
                                              removePlugin(tuple.pluginFile)
                                            }
                                          >
                                            &times; Delete
                                          </Button>
                                        )}
                                      </>
                                    </td>
                                    <td>{tuple.mountExists ? "✓" : ""}</td>
                                    <td>{tuple.foundExists ? "✓" : ""}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </Table>
                      </div>
                    </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="jumbotron">
        <Form>
          <Button
            variant={
              bntStatus.mount || Object.keys(changeTracker).length === 0
                ? "secondary"
                : "primary"
            }
            style={lstyle}
            disabled={
              bntStatus.mount || Object.keys(changeTracker).length === 0
            }
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.mount) {
                pluginMount(changeTracker);
              }
            }}
          >
            Process Changes
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/team-user");
            }}
          >
            Team Users &#9655;&#x25B7;
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.prev ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.prev}
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            &#9665;&#x25C1; Home Page
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

export default PluginManager;
