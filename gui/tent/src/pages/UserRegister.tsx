import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import axios from "axios";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./UserRegister.css";
import { useNavigate } from "react-router-dom";
import getAuthState from "@/utils/getAuthState";
import Loading from "@/pages/Loading";
import { Md5 } from "ts-md5";

const { VITE_API_SCHEME, VITE_API_SERVER, VITE_API_PORT } = import.meta.env;
const urlPort =
  !VITE_API_PORT ||
  (VITE_API_SCHEME === "http" && VITE_API_PORT === "80") ||
  (VITE_API_SCHEME === "https" && VITE_API_PORT === "443")
    ? ""
    : `:${VITE_API_PORT}`;
const backendPlat = `${VITE_API_SCHEME}://${VITE_API_SERVER}${urlPort}`;

function Register() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertState, setAlertState] = useState({ state: 0, message: "" });
  getAuthState().then(({ data }) => {
    console.log(JSON.stringify(data));
    setAuthState(data.state);
  });

  useEffect(() => {
    if (authState === "using" && alertState.state === 0)
      setAlertState({
        state: 1,
        message:
          "Feature is not available as the start user has been created already.",
      });
    if (alertState.message !== "") setShowAlert(true);
  }, [alertState, authState]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    acknowledge: false,
  });

  const { username, email, password, password2, acknowledge } = formData;

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      console.log("Passwords do not match");
      setAlertState({
        state: -2,
        message: "Passwords do not match ...",
      });
    } else if (!acknowledge) {
      console.log("Not respond the confirmation");
      setAlertState({
        state: -3,
        message:
          "You have to respond the checkbox to indicate you have the security knowlogy.",
      });
    } else {
      try {
        const newUser = {
          username,
          email,
          password: Md5.hashStr(password),
        };

        const config = {
          headers: {
            "Content-Type": "application/json",
          },
        };

        const body = JSON.stringify(newUser);
        const result = await axios.post(
          `${backendPlat}/authlogin/register`,
          body,
          config
        );
        if (result.status === 201) {
          if (result.data.state === 0) {
            navigate("/user-login");
          } else setAlertState(result.data);
        }
      } catch (err) {
        console.error(JSON.stringify(err));
        navigate("/404");
      }
    }
  };

  if (authState === "") return <Loading />;
  return (
    <div className="userregister_wrapper">
      {alertState.state != 0 ? (
        <Alert show={showAlert}>
          <Alert.Heading>First User Registration</Alert.Heading>
          <p>{alertState.message}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button
              onClick={() => {
                // setAlertState({ state: 0, message: "" });
                setShowAlert(false);
                if (alertState.state === 0) {
                  navigate("/user-login");
                } else if (alertState.state === 1) {
                  navigate("/");
                } else if (alertState.state === -1) {
                  navigate("/404");
                }
              }}
              variant="outline-success"
            >
              Close me
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="UserRegister">
          <Form className="userregister_form" onSubmit={(e) => onSubmit(e)}>
            <h3>Create Admin Account</h3>
            <br />
            <Form.Group className="mb-3">
              <Form.Label>User name</Form.Label>
              <Form.Control
                type="text"
                className="form-control"
                placeholder="Enter username"
                name="username"
                onChange={changeHandler}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                className="form-control"
                placeholder="Enter email"
                name="email"
                onChange={changeHandler}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                className="form-control"
                placeholder="Enter password"
                name="password"
                // minLength={6}
                onChange={changeHandler}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Retype Password</Form.Label>
              <Form.Control
                type="password"
                className="form-control"
                placeholder="Retype password"
                name="password2"
                onChange={changeHandler}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Do not expose this UI to Internet."
                // defaultValue={false}
                name="acknowledge"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    [e.target.name]: e.target.checked,
                  });
                }}
              />
            </Form.Group>
            <Form.Group className="d-grid">
              <Button type="submit" className="btn btn-primary">
                Create Admin
              </Button>
            </Form.Group>
          </Form>
        </div>
      )}
    </div>
  );
}

export default Register;
