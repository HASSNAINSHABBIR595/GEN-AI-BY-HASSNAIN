// Vercel serverless function entry point
import "dotenv/config";
import connectDb from "../src/config/database.js";
import app from "../src/app.js";

export default async function handler(req, res) {
  try {
    // Connect to MongoDB with caching (global.mongoose in database.js)
    await connectDb();
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("[Serverless handler error]", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}