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
        const data = await getMe();
        setUser(data.user);
      } catch {
        setUser(null);
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
