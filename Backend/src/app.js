import express from "express";
import authRouter from "./routes/auth.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { resumeSizeLimitMb } from "./middlewares/file.middleware.js";

const app = express();

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

// FRONTEND_URL is the canonical name; CLIENT_URL is kept as a backwards-compat
// alias so existing deployments keep working.
const rawOrigins =
  (process.env.FRONTEND_URL || process.env.CLIENT_URL || "");

const configuredOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const isDevelopment =
  (process.env.NODE_ENV || "development") !== "production";

// Default loopback origins are only added in development. In production only
// explicitly configured origins (from FRONTEND_URL / CLIENT_URL) are allowed,
// so loopback is not accepted unless someone deliberately sets it.
const defaultOrigins = isDevelopment ? DEFAULT_ORIGINS : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

function isLoopbackOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (curl, same-origin) are allowed.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (isDevelopment && isLoopbackOrigin(origin)) {
      return callback(null, true);
    }

    const error = new Error("Origin not allowed by CORS.");
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

/**
 * A request that comes from the same host as the API is always allowed, also
 * in production: that is the deployed setup, where the frontend and the API
 * share one origin (the browser sends an Origin header on every POST).
 */
function isSameOrigin(request, origin) {
  try {
    const host = request.headers.host;

    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

app.use(
  cors((request, callback) => {
    const origin = request.headers.origin;

    if (origin && !allowedOrigins.includes(origin) && !isSameOrigin(request, origin)) {
      if (!(isDevelopment && isLoopbackOrigin(origin))) {
        const error = new Error("Origin not allowed by CORS.");
        error.status = 403;
        return callback(error);
      }
    }

    return callback(null, corsOptions);
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

// Keep upload and request errors in the API's JSON format so the frontend
// can show a useful message instead of an HTML error page.
app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: `The resume must be smaller than ${resumeSizeLimitMb} MB.`,
    });
  }

  if (err?.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "The request body is too large.",
    });
  }

  if (err?.status === 403) {
    return res.status(403).json({
      message: "This origin is not allowed to access the API.",
    });
  }

  console.error("[API error]", err?.message || err);

  return res.status(500).json({
    message: "Something went wrong while processing the request.",
  });
});

export default app;
