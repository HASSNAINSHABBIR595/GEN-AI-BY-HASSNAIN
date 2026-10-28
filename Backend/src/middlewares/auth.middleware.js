import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../models/blackList.model.js";

async function authUser(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the environment.");
    }

    const isBlacklisted = await tokenBlacklistModel.exists({ token });

    if (isBlacklisted) {
      return res.status(401).json({
        message: "This session is no longer valid. Please log in again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired session. Please log in again.",
      });
    }

    console.error("[Auth Middleware]", error.message);

    return res.status(500).json({
      message: "Authentication could not be verified.",
    });
  }
}

export default authUser;
