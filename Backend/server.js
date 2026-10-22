import "dotenv/config";

// Validate required environment variables before anything else.
// Secret values are never logged.
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      "Set them in your deployment environment (Vercel project settings or .env).",
  );
  process.exit(1);
}

import app from "./src/app.js";
import connectDb from "./src/config/database.js";

const PORT = Number(process.env.PORT) || 3000;

// On Vercel this file is loaded as a serverless function: nothing listens on
// a port, the database is connected once per cold start before the first
// request is served, and the app is exported so Vercel can handle requests.
const isServerless = Boolean(process.env.VERCEL);

async function startServer() {
  try {
    await connectDb();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Report generation can take several minutes with a local model.
    server.requestTimeout = 15 * 60 * 1000;
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

if (isServerless) {
  try {
    await connectDb();
  } catch (error) {
    console.error("Server startup error:", error.message);
    throw error;
  }
} else {
  startServer();
}

export default app;
