// Vercel serverless function entry point
import "dotenv/config";

let app;
let connectDb;

// Lazy load modules to prevent cold start issues
async function initializeApp() {
  if (!app) {
    const appModule = await import("../src/app.js");
    app = appModule.default;
  }
  if (!connectDb) {
    const dbModule = await import("../src/config/database.js");
    connectDb = dbModule.default;
  }
}

export default async function handler(req, res) {
  try {
    // Initialize app and db connection lazily
    await initializeApp();
    
    // Connect to MongoDB with caching (global.mongoose in database.js)
    await connectDb();
    
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("[Serverless handler error]", error);
    console.error("[Error stack]", error.stack);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}