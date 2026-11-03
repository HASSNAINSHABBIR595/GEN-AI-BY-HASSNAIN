import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../models/blackList.model.js";

// Centralized cookie options for cross-origin authentication
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: true, // Always true for sameSite: "none" to work
    sameSite: "none", // Required for cross-domain cookies
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

/**
 * @name registerUserController,
 * @description register a new user , excepts username,email and password in the required body
 * @access public
 */

async function registerUserController(req, res) {
  const { email, username, password } = (req.body || {});
  if (!username || !email || !password) {
    return res.status(400).json({
      message: "please provide username,email and password",
    });
  }
  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "account already exists with this email address or username",
    });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username,
    email,
    password: hash,
  });

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  
  res.cookie("token", token, getCookieOptions());
  
  res.status(201).json({
    message: "user registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

/**
 * @name loginUserController,
 * @description login a  user , excepts ,email and password in the required body
 * @access public
 */

async function loginUserController(req, res) {
  const { email, password } = (req.body || {});
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "invalid email and password",
    });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({
      message: "invalid email and password",
    });
  }
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  
  res.cookie("token", token, getCookieOptions());
  
  res.status(200).json({
    message: "user loggedIn successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

/**
 * @name logoutUserController
 * @description it use token from user cookies and blacklist it and remove it from seccion
 * @access public
 */
async function logoutUserController(req, res) {
  const token = req.cookies.token;
  if (token) {
    await tokenBlacklistModel.create({ token });
  }
  
  // Clear cookie with same options (without maxAge)
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  
  res.status(200).json({
    message: "user logged out successfully",
  });
}

/**
 * @name getMeController
 * @description get the current logged in users details.
 * @access private
 */

async function getMeController(req, res) {
  const user = await userModel.findById(req.user.id);
  res.status(200).json({
    message: "user details fetched successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

// there are the exports of these controllers //
export { registerUserController };
export { loginUserController };
export { logoutUserController };
export { getMeController };
// there are the exports of these controllers //
