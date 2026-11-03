import { useEffect, useState } from "react";

import { AuthContext } from "./authContext.js";
import { getMe } from "./services/auth.api.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        // Only call get-me if token exists in localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        const data = await getMe();
        setUser(data.user);
      } catch {
        // If get-me fails, clear user and token
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }

    checkUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, setLoading, initialized }}
    >
      {children}
    </AuthContext.Provider>
  );
};
