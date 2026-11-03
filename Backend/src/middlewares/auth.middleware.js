import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../models/blackList.model.js";

async function authUser(req, res, next) {
  try {
    // Read token from Authorization header first, then fallback to cookie
    const authHeader = req.headers.authorization;
    const token =
      (authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1]) ||
      req.cookies?.token;

    console.log("[Auth Middleware] Token present:", !!token);

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
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
    console.error("[Auth Middleware Error]", error.message);
    
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired session. Please log in again.",
      });
    }

    return res.status(500).json({
      message: "Authentication could not be verified.",
    });
  }
}

export default authUser;
