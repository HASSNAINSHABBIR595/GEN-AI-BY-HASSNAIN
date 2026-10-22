import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import tokenBlacklistModel from "../models/blackList.model.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true, // JS se access nahi hoga
  secure: isProduction, // true in production (HTTPS), false in dev
  sameSite: isProduction ? "none" : "lax", // cross-site on different domains
  path: "/", // accessible from all routes
  maxAge: 24 * 60 * 60 * 1000, // 1 din
};

/**
 * @name registerUserController,
 * @description register a new user , excepts username,email and password in the required body
 * @access public
 */

async function registerUserController(req, res) {
  const { email, username, password } = req.body;
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
    { expiresIn: "1d" },
  );
  res.cookie("token", token, cookieOptions);
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
  const { email, password } = req.body;
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
    { expiresIn: "1d" },
  );
  res.cookie("token", token, cookieOptions);
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
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
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
