import express from "express";
import {
  getMeController,
  loginUserController,
  logoutUserController,
  registerUserController,
} from "../controllers/auth.controller.js";
import authUser from "../middlewares/auth.middleware.js";
const authRouter = express.Router();

/**
 * @route post / api/auth/register
 * @description register a new user
 */

authRouter.post("/register", registerUserController);

/**
 * @route post/api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login", loginUserController);

/**
 * @route get /api/auth/logout
 * @description clear cookie from user cookie and add the token in blacklist
 * @access public */

authRouter.get("/logout", logoutUserController);

/**
 * @Route get /api/auth/get-me
 * @description get the current users details.
 * @access private */

authRouter.get("/get-me", authUser, getMeController);

export default authRouter;
