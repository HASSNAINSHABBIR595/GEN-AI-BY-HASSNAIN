import { useContext } from "react";
import { AuthContext } from "../authContext.js";
import { login, register, logout } from "../services/auth.api.js";

export function useAuth() {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading, initialized } = context;

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await login({ email, password });
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    initialized,
    handleRegister,
    handleLogin,
    handleLogout,
  };
}
