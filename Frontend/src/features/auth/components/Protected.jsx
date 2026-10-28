import { Navigate } from "react-router";

import { useAuth } from "../hooks/useAuth";
import Loading from "../../../components/Loading";

const Protected = ({ children }) => {
  const { initialized, user } = useAuth();

  if (!initialized) return <Loading />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default Protected;
