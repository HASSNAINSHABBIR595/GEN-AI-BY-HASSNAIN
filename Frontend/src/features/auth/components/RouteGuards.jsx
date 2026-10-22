import { Navigate, Outlet } from "react-router";

import Loading from "../../../components/Loading.jsx";
import { useAuth } from "../hooks/useAuth";

/** Only logged-in users can visit */
export function ProtectedRoute() {
  const { user, initialized } = useAuth();

  if (!initialized) return <Loading />;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Only guests (not logged in) can visit */
export function GuestRoute() {
  const { user, initialized } = useAuth();

  if (!initialized) return <Loading />;

  return user ? <Navigate to="/app" replace /> : <Outlet />;
}
