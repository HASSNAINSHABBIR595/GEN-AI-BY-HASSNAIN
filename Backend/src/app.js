import express from "express";
import authRouter from "./routes/auth.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import statusRouter from "./routes/status.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...DEFAULT_ORIGINS, ...configuredOrigins])];

// During development the Vite dev server moves to another port when 5173 is
// taken, so any loopback origin is accepted. Production keeps the strict
// allowlist from CLIENT_URL.
const isDevelopment =
  (process.env.NODE_ENV || "development") !== "production";

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

app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/status", statusRouter);

// Keep upload and request errors in the API's JSON format so the frontend
// can show a useful message instead of an HTML error page.
app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "The resume must be smaller than 10 MB.",
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
