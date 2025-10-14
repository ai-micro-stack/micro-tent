import { useEffect, useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { Modal, Alert } from "react-bootstrap";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import type { Role } from "@/types/User";
import { emptyUser } from "@/types/User";
import { formatDate } from "@/utils/formatDate";
import { Md5 } from "ts-md5";

function UserProfile() {
  const bntInitState = {
    reset: true,
    save: true,
    cpwd: false,
  };

  const { axiosInstance, currentUser } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [bntStatus, setBntStatus] = useState(bntInitState);
  // const [refresh, setRefresh] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formProfile, setFormProfile] = useState(emptyUser);
  const [myProfile, setMyProfile] = useState(formProfile);
  const [validated, setValidated] = useState(false);
  const [modalUser, setModalUser] = useState({ ...formProfile, password: "" });
  const [showModal, setShowModal] = useState(false);
  const [modalAlert, setModalAlert] = useState(false);
  const [pwNotMatch, setPwNotMatch] = useState(false);

  useEffect(
    () => {
      axiosInstance
        .get("/authteam/roles")
        .then(({ data }) => {
          setRoles(data);
        })
        .catch((error) => console.error("Get Role Data failed ", error));

      if (currentUser) {
        getMyProfile(currentUser.uuid);
      } else {
        setSpinning(true);
      }
    },
    // eslint-disable-next-line
    [currentUser]
  );

  const getMyProfile = (uuid: string) => {
    axiosInstance
      .get(`/authteam/member/${uuid}`)
      .then(({ data }) => {
        delete data.password;
        const userInfo = { ...data };
        setMyProfile(userInfo);
        setFormProfile(userInfo);
        setBntStatus(bntInitState);
      })
      .catch((error) => console.error("Get Team User failed ", error));
  };

  const handleProfileSave = () => {
    axiosInstance
      .post(
        "/authteam/update",
        { ...myProfile, ...formProfile },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "x-member-uuid": myProfile.uuid,
          },
        }
      )
      .then(() => {})
      .catch((error) => {
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        console.error("Failed to send the member data to server.", error);
      });
  };

  const handleModalShow = () => {
    setModalUser({ ...myProfile, password: "" });
    setModalAlert(false);
    setPwNotMatch(false);
    setValidated(false);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setModalUser({ ...myProfile, password: "" });
    setModalAlert(false);
    setPwNotMatch(false);
    setValidated(false);
    setShowModal(false);
  };

  const handleModalSave = () => {
    const postRoute = modalUser.uuid ? "update" : "create";
    axiosInstance
      .post(
        `/authteam/${postRoute}`,
        { ...modalUser, password: Md5.hashStr(modalUser.password) },
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "x-member-uuid": modalUser.uuid,
          },
        }
      )
      .then(() => {
        setShowModal(false);
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

  const lstyle = { margin: 10 };
  const bstyle = { marginTop: 30, paddingLeft: 100 };

  return (
    <div className="jumbotron">
      <h3 className="text-center" style={lstyle}>
        <b>My Profile</b>
      </h3>
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
      <Container>
        <Form noValidate validated={validated}>
          {/* <Row> */}
          <Form.Group className="mb-2 d-flex">
            <Form.Label className=" col-sm-3 text-center">
              Member UUID:
            </Form.Label>
            <Form.Control
              plaintext
              readOnly
              className="square border border-1"
              defaultValue={formProfile.uuid}
            />
          </Form.Group>
          <Form.Group className="mb-2 d-flex">
            <Form.Label className=" col-sm-3 text-center">
              Login Name:
            </Form.Label>
            <Form.Control
              required
              type="input"
              value={formProfile.username}
              onChange={(e) => {
                setFormProfile({
                  ...formProfile,
                  username: e.target.value,
                });
                setBntStatus({
                  reset: false,
                  save: false,
                  cpwd: false,
                });
              }}
            />
          </Form.Group>

          <Form.Group className="mb-2 d-flex">
            <Form.Label className=" col-sm-3 text-center">
              Full Name:
            </Form.Label>
            <Form.Control
              type="input"
              value={formProfile.fullname}
              onChange={(e) => {
                setFormProfile({
                  ...formProfile,
                  fullname: e.target.value,
                });
                setBntStatus({
                  reset: false,
                  save: false,
                  cpwd: false,
                });
              }}
            />
          </Form.Group>
          <Form.Group className="mb-2 d-flex">
            <Form.Label className=" col-sm-3 text-center">Email:</Form.Label>
            <Form.Control
              type="email"
              value={formProfile.email}
              onChange={(e) => {
                setFormProfile({
                  ...formProfile,
                  email: e.target.value,
                });
                setBntStatus({
                  reset: false,
                  save: false,
                  cpwd: false,
                });
              }}
            />
          </Form.Group>
          <Form.Group className="mb-2 d-flex">
            <Form.Label className=" col-sm-3 text-center">Role:</Form.Label>
            <Form.Select
              value={formProfile.role_id}
              disabled={currentUser?.role_id !== 1}
              onChange={(e) => {
                setFormProfile({
                  ...formProfile,
                  role_id: Number(e.target.value),
                });
                setBntStatus({
                  reset: false,
                  save: false,
                  cpwd: false,
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
          <Form.Group className="mb-2 d-flex">
            <Form.Label className="col-sm-3 text-center">
              Created Date:
            </Form.Label>
            <Form.Control
              plaintext
              readOnly
              className="square border border-1"
              // defaultValue={formProfile.createdDate}
              value={formatDate(formProfile.createdDate)}
            />
          </Form.Group>
          <Form.Group className="mb-2 d-flex">
            <Form.Label className="col-sm-3 text-center">Active:</Form.Label>
            <Form.Check
              inline
              type="checkbox"
              disabled //={currentUser.role_id !== "1"}
              defaultChecked={formProfile.active}
              onChange={(e) => {
                setFormProfile({
                  ...formProfile,
                  active: e.target.checked,
                });
                setBntStatus({
                  reset: false,
                  save: false,
                  cpwd: false,
                });
              }}
            />
          </Form.Group>
          <Container style={bstyle}>
            <Button
              variant={bntStatus.reset ? "secondary" : "primary"}
              style={lstyle}
              disabled={bntStatus.reset}
              onClick={() => {
                // e.preventDefault();
                // getMyProfile(currentUser.uuid);
                setFormProfile(myProfile);
                setBntStatus(bntInitState);
              }}
            >
              Reset Form
            </Button>
            <Button
              variant={bntStatus.save ? "secondary" : "primary"}
              type="submit"
              style={lstyle}
              disabled={bntStatus.save}
              onClick={() => {
                // e.preventDefault();
                if (!bntStatus.save) {
                  handleProfileSave();
                  setBntStatus(bntInitState);
                }
              }}
            >
              Save Changes
            </Button>
            <Button
              className="float-end"
              variant={bntStatus.cpwd ? "outline-secondary" : "outline-primary"}
              style={lstyle}
              disabled={bntStatus.cpwd}
              onClick={(e) => {
                e.preventDefault();
                handleModalShow();
              }}
            >
              Change Password
            </Button>
          </Container>
        </Form>
      </Container>{" "}
      {spinning && <Loading />}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
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
            <Form.Group className="mb-2 d-flex">
              <Form.Label className=" col-sm-3 text-center">
                New Password:
              </Form.Label>
              <Form.Control
                required
                type="password"
                defaultValue={modalUser.password}
                onChange={(e) => {
                  if (e.target.value) {
                    setModalUser({
                      ...modalUser,
                      password: e.target.value,
                    });
                  }
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
                  if (e.target.value && e.target.value !== modalUser.password) {
                    setPwNotMatch(true);
                  } else setPwNotMatch(false);
                }}
              />
              <Form.Control.Feedback type="invalid">
                Password not match!
              </Form.Control.Feedback>
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

export default UserProfile;
