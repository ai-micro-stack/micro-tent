import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { storeRefreshToken } from "@/utils/refreshToken";
import { useAuth } from "@/components/AuthService";
import Logo from "@/assets/logo192.png";
import "@/pages/UserLogin.css";
import { Md5 } from "ts-md5";

const UserLogin = () => {
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [inputRemeberMe, setInputRemeberMe] = useState(false);
  const [errMsg, setErrMsg] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [logining, setLogining] = useState(false);
  const { axiosInstance, onLogin, onLogout } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogining(true);

    if (!inputUsername) {
      setErrMsg(["Please enter your username"]);
      setShowAlert(true);
      return;
    }

    if (!inputPassword) {
      setErrMsg(["Please enter your password"]);
      setShowAlert(true);
      return;
    }

    axiosInstance
      .post("/authlogin/login", {
        username: inputUsername,
        password: Md5.hashStr(inputPassword),
      })
      .then((res) => {
        if (res.status === 200) {
          if (res.data?.refreshToken) {
            storeRefreshToken(res.data.refreshToken, inputRemeberMe);
            onLogin();
            setErrMsg([]);
          } else {
            storeRefreshToken("", false);
            onLogout();
            setErrMsg(["api service does not work properly."]);
            setShowAlert(true);
          }
        } else {
          storeRefreshToken("", false);
          onLogout();
          setErrMsg([res.data.message]);
          setShowAlert(true);
        }
      })
      .catch((error) => {
        setErrMsg([
          error.message,
          error.status === 403
            ? "--- You don't have permission to make this operation."
            : "",
        ]);
        setShowAlert(true);
      });

    setLogining(false);
  };

  const handlePassword = () => {};

  return (
    <div
      className="sign-in__wrapper"
      // style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      {/* Overlay */}
      <div className="sign-in__backdrop"></div>
      {/* Form */}
      <Form
        className="shadow p-4 bg-white rounded"
        onSubmit={(e) => {
          handleSubmit(e);
        }}
      >
        {/* Header */}
        <img
          className="img-thumbnail mx-auto d-block mb-2"
          src={Logo}
          alt="logo"
        />
        <div className="h4 mb-2 text-center">Sign In</div>
        {/* ALert */}
        {showAlert ? (
          <Alert
            className="mb-2"
            variant="danger"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {errMsg.length
              ? errMsg.join(" ")
              : "Incorrect username or password."}
          </Alert>
        ) : (
          <div />
        )}
        <Form.Group className="mb-2 d-flex" controlId="username">
          <Form.Label className="col-sm-3">Username</Form.Label>
          <Form.Control
            type="text"
            value={inputUsername}
            placeholder="Username"
            onChange={(e) => setInputUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-2 d-flex" controlId="password">
          <Form.Label className="col-sm-3">Password</Form.Label>
          <Form.Control
            type="password"
            value={inputPassword}
            placeholder="Password"
            onChange={(e) => setInputPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-2" controlId="checkbox">
          <Form.Check
            type="checkbox"
            label="Remember me"
            defaultChecked={inputRemeberMe}
            onChange={(e) => setInputRemeberMe(e.target.checked)}
          />
        </Form.Group>
        {logining ? (
          <Button className="w-100" variant="primary" type="submit" disabled>
            Logging In...
          </Button>
        ) : (
          <Button className="w-100" variant="primary" type="submit">
            Log In
          </Button>
        )}
        <div className="d-grid justify-content-end">
          <Button
            className="text-muted px-0"
            variant="link"
            onClick={handlePassword}
          >
            Forgot password?
          </Button>
        </div>
      </Form>
      {/* Footer */}
      <div className="w-100 mb-2 position-absolute bottom-0 start-50 translate-middle-x text-white text-center">
        Made by Hendrik C | &copy;2022
      </div>
    </div>
  );
};

export default UserLogin;
