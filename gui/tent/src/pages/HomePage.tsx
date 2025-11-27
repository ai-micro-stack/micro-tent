import {
  Container,
  Row,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthService";
import "@/pages/HomePage.css";
import { useState, useEffect } from "react";
import getAuthState from "@/utils/getAuthState";

function HomePage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState("");

  useEffect(() => {
    getAuthState().then(({ data }) => {
      setAuthState(data.state);
    });
  }, []);

  useEffect(
    () => {
      if (authState === "config") {
        navigate("/register");
      }
    },
    // eslint-disable-next-line
    [authState]
  );

  return (
    <div className="homepage_wrapper">
      <Container fluid>
        <Row>
          <svg
            version="1.1"
            id="svg1"
            width="1600"
            height="840"
            viewBox="0 0 1600 840"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs id="defs1" />
            <g id="g1">
              <image
                width="1600"
                height="840"
                preserveAspectRatio="none"
                href="/hci.png"
                id="hci"
              />
            </g>
          </svg>
        </Row>
        {accessToken && (
          <div className="text-center position-absolute bottom-0 end-0 translate-middle">
            <Button
              className="float-end"
              variant="outline-primary"
              onClick={(e) => {
                e.preventDefault();
                navigate("/tent-resource");
              }}
            >
              Let's Start &#9655;&#x25B7;
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
export default HomePage;
