import axios from "axios";
const { VITE_API_SCHEME, VITE_API_SERVER, VITE_API_PORT } = import.meta.env;
const urlPort =
  !VITE_API_PORT ||
  (VITE_API_SCHEME === "http" && VITE_API_PORT === "80") ||
  (VITE_API_SCHEME === "https" && VITE_API_PORT === "443")
    ? ""
    : `:${VITE_API_PORT}`;
const backendPlat = `${VITE_API_SCHEME}://${VITE_API_SERVER}${urlPort}`;

const getAuthState = async () => {
  return await axios.get(`${backendPlat}/authlogin/mode`);
};

export default getAuthState;
