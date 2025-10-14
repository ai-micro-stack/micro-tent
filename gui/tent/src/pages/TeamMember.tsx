import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Table, Button } from "react-bootstrap";
import { Modal, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
// import Loading from "@/pages/Loading";
import type { User, Role } from "@/types/User";
import { emptyUser } from "@/types/User";
import { formatDate } from "@/utils/formatDate";
import { Md5 } from "ts-md5";

function TeamMember() {
  const bntInitState = {
    add: false,
    prev: false,
    next: false,
  };
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  // const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);
  const [showModal, setShowModal] = useState(false);
  const [modalMember, setModalMember] = useState(emptyUser);
  const [modalAlert, setModalAlert] = useState(false);
  const [pwNotMatch, setPwNotMatch] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(
    () => {
      axiosInstance
        .get("/authteam/roles")
        .then(({ data }) => {
          setRoles(data);
          let membersInTeam = [];
          axiosInstance
            .get("/authteam/members")
            .then(({ data }) => {
              const { /*dhcpDomain,*/ members } = data;
              membersInTeam = members.map((member: User) => {
                return member;
              });
              setTeamMembers(membersInTeam);
              if (membersInTeam.length) {
                setBntStatus({
                  ...bntStatus,
                  prev: false,
                  next: false,
                });
              }
            })
            .catch((error) => console.error("Get Team User failed ", error));
        })
        .catch((error) => console.error("Get Role Data failed ", error));
    },
    // eslint-disable-next-line
    [refresh]
  );

  const handleModalShow = (uuid: string | null) => {
    const member: User | null =
      teamMembers.find((member: User) => {
        return member.uuid === uuid;
      }) ?? emptyUser;
    setModalMember(member);
    setModalAlert(false);
    setPwNotMatch(false);
    setValidated(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setModalMember(emptyUser);
    setModalAlert(false);
    setPwNotMatch(false);
    setValidated(false);
    setShowModal(false);
  };

  const handleModalSave = () => {
    // const form = e.currentTarget;
    // if (form.checkValidity() === false) {
    //   e.preventDefault();
    //   e.stopPropagation();
    // }
    // setValidated(true);

    const postRoute = modalMember.uuid ? "update" : "create";
    const pwHashing =
      !modalMember.uuid && modalMember.password !== undefined
        ? { password: Md5.hashStr(modalMember.password) }
        : {};
    axiosInstance
      .post(
        `/authteam/${postRoute}`,
        { ...modalMember, ...pwHashing },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "x-member-uuid": modalMember.uuid,
          },
        }
      )
      .then(() => {
        setShowModal(false);
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
        console.error("Failed to send the member data to server.", error);
      });
  };

  const memberDelete = (uuid: string) => {
    const member: User | undefined = teamMembers.find((member: User) => {
      return member.uuid === uuid;
    });
    const confirmDelete = window.confirm(`Delete "${member?.fullname}" ?`);
    if (confirmDelete) {
      axiosInstance
        .delete(
          "/authteam/delete", // { params: uuid },
          {
            headers: {
              "x-member-uuid": uuid,
            },
          }
        )
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
          setModalAlert(true);
          console.error("Delete team member failed ", error);
        });
    }
  };

  const lstyle = { margin: 10 };
  const bstyle = { padding: 20 };

  return (
    <div>
      <h3 className="text-center" style={lstyle}>
        <b>Team User</b>
      </h3>
      {/* <div className="jumbotron">
        <Form>
          <Form.Group>
            <Form.Control
              id="fileSelector"
              onChange={(e) => {
                getFileContext(e.target);
              }}
              // label="Example file input"
              type="file"
            />
          </Form.Group>
        </Form>
      </div> */}
      {/* ALert */}
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
          <thead className="text-center">
            <tr>
              <th>
                <Button variant="link">
                  <b>Login Name (&#9650;&#9660;)</b>
                </Button>
              </th>
              <th>
                <Button variant="link">
                  <b>Full Name (&#9650;&#9660;)</b>
                </Button>
              </th>
              <th>
                <Button variant="link">
                  <b>Email (&#9650;&#9660;)</b>
                </Button>
              </th>
              <th>
                <Button variant="link">
                  <b>Role (&#9650;&#9660;)</b>
                </Button>
              </th>
              <th>
                <Button variant="link">
                  <b>Created Date (&#9650;&#9660;)</b>
                </Button>
              </th>
              <th>
                <Button variant="link">
                  <b>Active (&#9650;&#9660;)</b>
                </Button>
              </th>
              <th>
                <Button variant="link">
                  <b>Modifiers</b>
                </Button>
              </th>
            </tr>
          </thead>
          <tbody className="text-center">
            {teamMembers.map((member: User) => {
              return (
                <tr key={member.uuid}>
                  <td>{member.username}</td>
                  <td>{member.fullname}</td>
                  <td>{member.email}</td>
                  <td>
                    {!member.role_id || member.role_id === 0
                      ? ""
                      : roles.find(({ id }) => {
                          return id == member.role_id;
                        })?.role}
                  </td>
                  <td>{formatDate(member.createdDate)}</td>
                  <td>{member.active ? "Yes" : "No"}</td>
                  <td className="d-flex gap-2">
                    <Button
                      className="edit-btn"
                      variant="danger"
                      size="sm"
                      onClick={() => handleModalShow(member.uuid)}
                    >
                      <b>&#9998; Edit</b>
                    </Button>
                    <Button
                      className="remove-btn"
                      variant="danger"
                      size="sm"
                      onClick={() => memberDelete(member.uuid)}
                    >
                      <b>&#10005; Delete</b>
                    </Button>
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
            variant={bntStatus.add ? "secondary" : "primary"}
            style={lstyle}
            disabled={bntStatus.add}
            onClick={(e) => {
              e.preventDefault();
              if (!bntStatus.add) {
                handleModalShow(null);
              }
            }}
          >
            Add Team Member
          </Button>
          <Button
            className="float-end"
            variant={bntStatus.next ? "outline-secondary" : "outline-primary"}
            style={lstyle}
            disabled={bntStatus.next}
            onClick={(e) => {
              e.preventDefault();
              navigate("/about-up");
            }}
          >
            About &#9655;&#x25B7;
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
      {/* {spinning && <Loading />} */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Team Member Details</Modal.Title>
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
            {/* <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Member UUID:
              </Form.Label>
              <Form.Control
                // id="dhcpNextServer"
                plaintext
                readOnly
                className="square border border-1"
                defaultValue={modalMember.uuid}
              />
            </Form.Group> */}
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Login Name:
              </Form.Label>
              <Form.Control
                required
                type="input"
                defaultValue={modalMember?.username}
                onChange={(e) => {
                  setModalMember({
                    ...modalMember,
                    username: e.target.value,
                  });
                }}
              />
            </Form.Group>
            {!modalMember?.uuid && (
              <>
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    Password:
                  </Form.Label>
                  <Form.Control
                    required
                    type="password"
                    defaultValue={modalMember?.password}
                    onChange={(e) => {
                      setModalMember({
                        ...modalMember,
                        password: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
                {pwNotMatch && (
                  <div className="float-end  text-danger">Not match</div>
                )}
                <Form.Group className="mb-2 d-flex">
                  <Form.Label className=" col-sm-3 text-center">
                    Retype Password:
                  </Form.Label>
                  <Form.Control
                    required
                    type="password"
                    onChange={(e) => {
                      if (
                        e.target.value &&
                        e.target.value !== modalMember?.password
                      ) {
                        setPwNotMatch(true);
                      } else setPwNotMatch(false);
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    Password not match!
                  </Form.Control.Feedback>
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                Full Name:
              </Form.Label>
              <Form.Control
                type="input"
                defaultValue={modalMember?.fullname}
                onChange={(e) => {
                  setModalMember({
                    ...modalMember,
                    fullname: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">Email:</Form.Label>
              <Form.Control
                type="email"
                defaultValue={modalMember?.email}
                onChange={(e) => {
                  setModalMember({
                    ...modalMember,
                    email: e.target.value,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">Role:</Form.Label>
              <Form.Select
                value={modalMember?.role_id}
                onChange={(e) => {
                  setModalMember({
                    ...modalMember,
                    role_id: Number(e.target.value),
                  });
                }}
              >
                {roles.map(({ id, role }) => {
                  return (
                    <option key={id} value={id} disabled={id ? false : true}>
                      {role}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            {/* <Form.Group className="mb-2 d-flex">
              <Form.Label className="col-sm-3 text-center">
                Created Date:
              </Form.Label>
              <Form.Control
                // id="dhcpNextServer"
                plaintext
                readOnly
                className="square border border-1"
                defaultValue={modalMember.createdDate}
              />
            </Form.Group> */}
            <Form.Group className="mb-2 d-flex">
              <Form.Label className="col-sm-3 text-center">Active:</Form.Label>
              <Form.Check
                inline
                type="checkbox"
                defaultChecked={modalMember?.active}
                onChange={(e) => {
                  setModalMember({
                    ...modalMember,
                    active: e.target.checked,
                  });
                }}
              />
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
    </div>
  );
}

export default TeamMember;
