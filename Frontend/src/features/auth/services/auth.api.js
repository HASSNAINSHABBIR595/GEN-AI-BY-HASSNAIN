import api from "../../../lib/api.js";

// Register
async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });

  // Save token to localStorage for token-based auth
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  return response.data;
}

// Login
async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  // Save token to localStorage for token-based auth
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }

  return response.data;
}

// Logout
async function logout() {
  try {
    const response = await api.get("/api/auth/logout");
    return response.data;
  } finally {
    // Always remove token, even if API call fails
    localStorage.removeItem("token");
  }
}

// Get current user
async function getMe() {
  const response = await api.get("/api/auth/get-me");
  return response.data;
}

export { register, login, logout, getMe };
