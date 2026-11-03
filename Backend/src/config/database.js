import mongoose from "mongoose";
import "dotenv/config";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "1.0.0.1"]);

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the environment.");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  console.log("Database connected successfully.");
  return cached.conn;
}

export default connectDb;