import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI);

const reports = mongoose.connection.collection("interviewreports");
const users = mongoose.connection.collection("users");

console.log("db:", mongoose.connection.name);
console.log("report count:", await reports.countDocuments());
console.log(
  "reports:",
  (await reports.find({}, { projection: { user: 1, candidateName: 1, targetRole: 1, matchScore: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(10).toArray()),
);
console.log(
  "users:",
  (await users.find({}, { projection: { email: 1, username: 1 } }).limit(10).toArray()),
);

await mongoose.disconnect();
