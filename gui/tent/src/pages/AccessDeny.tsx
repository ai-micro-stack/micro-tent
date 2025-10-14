import { useState } from "react";
import type { ModalProps } from "react-bootstrap";
import {
  Container,
  Form,
  Row,
  Col,
  Button,
  Image,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { storeRefreshToken } from "@/utils/refreshToken";
import { useAuth } from "@/components/AuthService";

function MyVerticallyCenteredModal(props: ModalProps) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Access Permission Denied
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>Authorization Required:</h5>
        <p>
          This page needs required permission to access. Please contact the PXE
          administrator if any change is needed.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

function AccessDeny() {
  const navigate = useNavigate();
  const [modalShow, setModalShow] = useState(true);
  const { onLogout } = useAuth();

  return (
    <div>
      <Container fluid>
        <Row>
          <Col className="text-center">
            <Image src="access-deny.png" fluid />
          </Col>
        </Row>
      </Container>
      <MyVerticallyCenteredModal
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
      <div className="jumbotron">
        <Form>
          <Button
            onClick={(e) => {
              e.preventDefault();
              storeRefreshToken("", false);
              onLogout();
            }}
          >
            Sign in as Authorized User
          </Button>
          <Button
            className="float-end"
            variant={"outline-primary"}
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            &#9665;&#x25C1; Back to Home Page
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default AccessDeny;
