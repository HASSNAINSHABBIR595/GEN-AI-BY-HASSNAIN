import mongoose from "mongoose";
import "dotenv/config";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "1.0.0.1"]);

async function connectDb() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the environment.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
}

export default connectDb;
