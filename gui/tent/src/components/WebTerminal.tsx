import type { PropsWithChildren } from "react";
import { useRef, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Terminal } from "@xterm/xterm";
// import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { SerializeAddon } from "@xterm/addon-serialize";
import { Modal, Button } from "react-bootstrap";
import { io } from "socket.io-client";
import { useAuth } from "@/components/AuthService";

const { VITE_API_SCHEME, VITE_API_SERVER, VITE_API_PORT } = import.meta.env;
const backend = `${VITE_API_SCHEME}://${VITE_API_SERVER}:${VITE_API_PORT}`;

const serializeAddon = new SerializeAddon();

export const WebTerminal = () => {
  const terminalRef = useRef(null);
  const { accessToken } = useAuth();
  const socket = io(`${backend}`, {
    reconnection: true,
    extraHeaders: {
      authorization: `bearer ${accessToken}`,
    },
    auth: {
      token: `${accessToken}`,
    },
    query: {
      "my-key": "my-value",
    },
  });

  useEffect(
    () => {
      if (terminalRef.current) {
        const terminal = new Terminal({
          convertEol: true,
          cursorBlink: true,
          // fontFamily: "Arial, Monospace",
          fontSize: 12,
        });
        terminal.open(terminalRef.current);

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        fitAddon.fit();

        terminal.loadAddon(serializeAddon);

        // Example: Write text to the terminal
        // terminal.write("Welcome to xterm.js!\n");

        // connect event handler
        socket.on("connect", function () {
          terminal.write("\r\n*** Connected to backend***\r\n");
        });

        // Backend -> Browser
        socket.on("data", function (data) {
          terminal.write(data);
        });

        socket.on("disconnect", function () {
          terminal.write("\r\n*** Disconnected from backend***\r\n");
          // console.log(serializeAddon.serialize());
        });

        // terminalRef.current = terminal

        // Example: Handle user input
        terminal.onData((data) => {
          console.log(data);
          // socket.emit("data", data);
        });
      }
      return () => {
        // window.removeEventListener("resize", handleResize);
        // terminal.dispose();
        socket.disconnect();
      };
    },
    // eslint-disable-next-line
    []
  );

  return (
    <Container>
      <Row>
        <Col>
          <div
            ref={terminalRef}
            style={{
              width: "100%",
              height: "600px",
              backgroundColor: "black",
            }}
          />
        </Col>
      </Row>
    </Container>
  );
};

type TerminalModalProps = PropsWithChildren & {
  showTerminal: boolean;
  handleTerminalClose: () => void;
};

const handleTerminalCopy = async (serializeAddon: SerializeAddon) => {
  try {
    const termText = serializeAddon.serialize();
    await navigator.clipboard.writeText(termText);
    alert("Copied terminal text to clipboard");
  } catch (err) {
    alert("Failed to copy text. " + err);
  }
};

export const TerminalModal = ({
  showTerminal,
  handleTerminalClose,
}: // children,
TerminalModalProps) => {
  return (
    <Modal
      size="xl"
      backdrop="static"
      keyboard={false}
      show={showTerminal}
      onHide={handleTerminalClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>Backend Processing</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <WebTerminal />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleTerminalClose}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            handleTerminalCopy(serializeAddon);
          }}
        >
          Copy
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
