import type { NavLinkRenderProps } from "react-router";
import { Routes, Route, NavLink } from "react-router";
import { Container, Row, Col, Navbar, Nav, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@/components/AuthService";
import { storeRefreshToken } from "@/utils/refreshToken";
import { PrivateRoute } from "@/components/PrivateRoute";

const HomePage = lazy(() => import("@/pages/HomePage"));
const TentResource = lazy(() => import("@/pages/TentResource"));
const TentPlanner = lazy(() => import("@/pages/TentPlanner"));
const TentBuilder = lazy(() => import("@/pages/TentBuilder"));
const TentClusters = lazy(() => import("@/pages/TentClusters"));
const TentPlugin = lazy(() => import("@/pages/TentPlugin"));
const TeamMember = lazy(() => import("@/pages/TeamMember"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const UserLogin = lazy(() => import("@/pages/UserLogin"));
const Register = lazy(() => import("@/pages/UserRegister"));

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const style = ({ isActive }: NavLinkRenderProps) => ({
  fontWeight: isActive ? "bold" : "normal",
  whiteSpace: "pre",
});

const Navigation = () => {
  const { accessToken, onLogout } = useAuth();
  const navigate = useNavigate();
  return (
    <Navbar
      bg="primary"
      data-bs-theme="dark"
      className="nav"
    >
      <Container>
        <Navbar.Brand>
          <img
            src="/favicon.ico"
            width="28"
            height="28"
            className="d-inline-block align-bottom me-2"
            alt=""
          />
          Micro Tent
        </Navbar.Brand>
        <Nav className="me-auto">
          <Container>
            <NavLink to="/" style={style}>
              Home Page
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/tent-resource" style={style}>
              Resource Finder
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/tent-planner" style={style}>
              Tent Planner
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/tent-builder" style={style}>
              Tent Builder
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/tent-clusters" style={style}>
              Active Clusters
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/tent-plugin" style={style}>
              Tent Plugins
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/team-user" style={style}>
              Team User
            </NavLink>
          </Container>
          <Container>
            <NavLink to="/about-up" style={style}>
              About
            </NavLink>
          </Container>
        </Nav>
      </Container>
      <Container className="d-flex justify-content-end gap-2">
        {accessToken && (
          <Button
            style={{
              backgroundColor: "transparent",
              backgroundImage: "url('/profile.png')",
              backgroundSize: "cover",
              width: "40px",
              height: "40px",
            }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/user-profile");
            }}
          ></Button>
        )}
        {accessToken ? (
          <Button
            className="float-end"
            onClick={(e) => {
              e.preventDefault();
              storeRefreshToken("", false);
              onLogout();
              navigate("/");
            }}
          >
            Sign Out
          </Button>
        ) : (
          <Button
            className="float-end"
            onClick={(e) => {
              e.preventDefault();
              navigate("/user-login");
            }}
          >
            Sign In
          </Button>
        )}
      </Container>
    </Navbar>
  );
};

const App = () => {
  return (
    <div>
      <Row>
        <Col>
          <AuthProvider>
            <Navigation />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
              <Route index element={<HomePage />} />
              <Route
                path="tent-resource"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <TentResource />
                  </PrivateRoute>
                }
              />
              <Route
                path="tent-planner"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <TentPlanner />
                  </PrivateRoute>
                }
              />
              <Route
                path="tent-builder"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <TentBuilder />
                  </PrivateRoute>
                }
              />
              <Route
                path="tent-clusters"
                element={
                  <PrivateRoute allowedRoles={[1, 2, 3, 9]}>
                    <TentClusters />
                  </PrivateRoute>
                }
              />
              <Route
                path="tent-plugin"
                element={
                  <PrivateRoute allowedRoles={[1, 2, 3, 9]}>
                    <TentPlugin />
                  </PrivateRoute>
                }
              />
              <Route
                path="team-user"
                element={
                  <PrivateRoute allowedRoles={[1, 9]}>
                    <TeamMember />
                  </PrivateRoute>
                }
              />
              <Route
                path="user-profile"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
              <Route path="about-up" element={<AboutUs />} />
              <Route path="user-login" element={<UserLogin />} />
              <Route path="register" element={<Register />} />
              <Route path="*" element={<p>There's nothing here: 404!</p>} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </Col>
      </Row>
    </div>
  );
};

export default App;
