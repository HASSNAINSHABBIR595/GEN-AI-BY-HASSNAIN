import axios from "axios";

// `import.meta.env` only exists under Vite, so it is read defensively:
// the module is also imported by plain Node scripts and tests.
const env = import.meta.env ?? {};

const configuredBaseUrl = env.VITE_API_URL?.trim();

export const API_BASE_URL = (
  configuredBaseUrl || "http://localhost:3000"
).replace(/\/+$/, "");

// Report generation runs two local model calls (assessment + questions).
// On CPU-only machines that can take a long time, so the client waits longer
// than the server does before giving up. Override with VITE_API_TIMEOUT_MS.
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000;
const configuredTimeout = Number(env.VITE_API_TIMEOUT_MS);
const REQUEST_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_TIMEOUT_MS;

/**
 * Shared HTTP client for the GEN+AI API.
 *
 * - Sends the httpOnly auth cookie on every request.
 * - Uses a long timeout because report generation runs two local model calls
 *   (assessment + questions), which can take several minutes on CPU.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

function serverMessage(error) {
  const message = error?.response?.data?.message;
  return typeof message === "string" ? message.trim() : "";
}

/**
 * Turns an API/network failure into a short, user-safe message.
 * Raw response bodies, stack traces and internal paths are never surfaced.
 */
export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "The request timed out while generating the report. Please try again.";
    }

    if (error.code === "ERR_CANCELED") {
      return "The request was cancelled.";
    }

    if (!error.response) {
      return "Could not reach the GEN+AI server. Check that the backend is running and that VITE_API_URL points to it.";
    }

    const status = error.response.status;
    const message = serverMessage(error);

    if (status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (status === 403) {
      return "You do not have permission to access this report.";
    }

    if (status === 413) {
      return "The resume is too large. Upload a PDF smaller than 10 MB.";
    }

    if (status === 400 || status === 422) {
      return message || "Please check the form and try again.";
    }

    if (status >= 500) {
      return (
        message ||
        "The report engine could not complete this request. Please try again."
      );
    }

    return message || fallback;
  }

  if (error?.name === "CanceledError") {
    return "The request was cancelled.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default api;
