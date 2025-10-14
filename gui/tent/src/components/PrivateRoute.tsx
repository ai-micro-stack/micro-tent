import type { User } from "@/types/User";
import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router";
import { fetchRefreshToken } from "@/utils/refreshToken";
import { useAuth } from "@/components/AuthService";
import Loading from "@/pages/Loading";
import AccessDeny from "@/pages/AccessDeny";

type PrivateRouteProps = PropsWithChildren & {
  allowedRoles?: User["role_id"][];
};

export const PrivateRoute = ({ allowedRoles, children }: PrivateRouteProps) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (currentUser === undefined) {
    return <Loading />;
  }

  if (
    currentUser === null ||
    (allowedRoles && !allowedRoles.includes(currentUser.role_id))
  ) {
    if (fetchRefreshToken()) {
      return <AccessDeny />;
    } else {
      return <Navigate to="/user-login" replace state={{ from: location }} />;
    }
  }

  return children;
};
