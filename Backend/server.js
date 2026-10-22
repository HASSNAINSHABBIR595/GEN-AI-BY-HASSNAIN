import "dotenv/config";

import app from "./src/app.js";
import connectDb from "./src/config/database.js";

const PORT = Number(process.env.PORT) || 3000;

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

startServer();
