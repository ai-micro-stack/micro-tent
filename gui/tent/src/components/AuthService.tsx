import type { User } from "@/types/User";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import axios, { AxiosError } from "axios";
import { fetchRefreshToken, storeRefreshToken } from "@/utils/refreshToken";

const { VITE_API_SCHEME, VITE_API_SERVER, VITE_API_PORT } = import.meta.env;
const urlPort =
  !VITE_API_PORT ||
  (VITE_API_SCHEME === "http" && VITE_API_PORT === "80") ||
  (VITE_API_SCHEME === "https" && VITE_API_PORT === "443")
    ? ""
    : `:${VITE_API_PORT}`;
const backendPlat = `${VITE_API_SCHEME}://${VITE_API_SERVER}${urlPort}`;

// function delay(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

type AuthContext = {
  axiosInstance: AxiosInstance;
  accessToken?: string | null;
  currentUser?: User | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

type AuthProviderProps = PropsWithChildren;

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [accessToken, setAccessToken] = useState<string | null>();
  const [currentUser, setCurrentUser] = useState<User | null>();

  async function handleLogin() {
    try {
      fetchAccessToken();
      const origin = location.state?.from?.pathname || "/";
      navigate(origin);
    } catch {
      handleLogout();
      throw new Error("Not able to handle the login.");
    }
  }

  async function handleLogout() {
    setAccessToken(null);
    setCurrentUser(null);
  }

  function fetchAccessToken() {
    const refreshToken = fetchRefreshToken();
    if (refreshToken) {
      try {
        axiosInstance.post("/authlogin/fetch", { refreshToken }).then((res) => {
          if (res.status === 200 && res.data?.accessToken) {
            const authData = { ...res.data };
            storeRefreshToken(authData.refreshToken, null);
            setAccessToken(authData.accessToken);
            setCurrentUser(authData.user);
            // setErrMsg([]);
          } else {
            storeRefreshToken("", false);
            handleLogout();
            navigate("/user-login");
            // setErrMsg([res.data.message]);
          }
        });
      } catch {
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }

  // axios instance wrapped in the auth service
  const axiosInstance = axios.create({
    baseURL: backendPlat,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

  // http request interceptor
  axiosInstance.interceptors.request.use(
    function (config: InternalAxiosRequestConfig) {
      if (
        window.location.href.endsWith("/register") ||
        window.location.href.endsWith("/login") ||
        window.location.href.endsWith("/fetch") ||
        config.headers.get("Authorization")
      )
        return config;

      const token = accessToken || fetchRefreshToken();

      if (!token) {
        navigate("/user-login");
      }

      config.headers.set("Authorization", `Bearer ${accessToken}`);
      return config;
    },
    function (error: AxiosError) {
      return Promise.reject(error);
    }
  );

  // http response interceptor
  axiosInstance.interceptors.response.use(
    function (response: AxiosResponse) {
      // const { accessToken, onLogin } = useAuth();
      if (
        !window.location.href.endsWith("/user-login") &&
        (response.status === 401 || response.status === 403)
      ) {
        handleLogout();
        // fetchAccessToken();
        // navigate("/user-login");
        // delay(1000);
      }
      if (
        window.location.href.endsWith("/fetch") &&
        (response.status === 401 || response.status === 403)
      ) {
        handleLogout();
        // navigate("/user-login");
      }
      return response;
    },
    function (error: AxiosError) {
      // if (accessToken && error.response.status === 401) {
      //   // onLogout(); // sets currentUser logout if accessToken expired
      //   navigate("/user-login");
      //   // fetchAccessToken();
      //   delay(1000);
      // }
      if (window.location.href.endsWith("/fetch")) {
        handleLogout();
        // navigate("/user-login");
      }
      // throw error;
      return Promise.reject(error);
    }
    // [accessToken]
  );

  useEffect(
    () => {
      fetchAccessToken();
    },
    // eslint-disable-next-line
    []
  );

  return (
    <AuthContext.Provider
      value={{
        axiosInstance,
        accessToken,
        currentUser,
        onLogin: handleLogin,
        onLogout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used inside of a AuthProvider");
  }

  return context;
}
