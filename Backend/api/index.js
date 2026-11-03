import "dotenv/config";
import connectDb from "../src/config/database.js";
import app from "../src/app.js";

export default async function handler(req, res) {
  await connectDb();
  return app(req, res);
}