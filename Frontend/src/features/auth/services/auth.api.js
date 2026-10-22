import api from "../../../lib/api.js";

// Register
async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });

  return response.data;
}

// Login
async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  return response.data;
}

// Logout
async function logout() {
  const response = await api.get("/api/auth/logout");
  return response.data;
}

// Get current user
async function getMe() {
  const response = await api.get("/api/auth/get-me");
  return response.data;
}

export { register, login, logout, getMe };
