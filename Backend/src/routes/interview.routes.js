import express from "express";
import authUser from "../middlewares/auth.middleware.js";
import { uploadResume } from "../middlewares/file.middleware.js";
import {
  generateInterviewController,
  getAllReportsController,
  getSingleReportController,
  deleteReportController,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

/**
 * @route  POST /api/interview
 * @desc   Generate new interview report
 * @access Private
 * @body   { selfDescription, jobDescription } + resume (PDF file)
 */
interviewRouter.post(
  "/",
  authUser,
  uploadResume,
  generateInterviewController,
);

/**
 * @route  GET /api/interview
 * @desc   Get all reports for logged in user
 * @access Private
 */
interviewRouter.get("/", authUser, getAllReportsController);

/**
 * @route  GET /api/interview/:id
 * @desc   Get single report by ID
 * @access Private
 */
interviewRouter.get("/:id", authUser, getSingleReportController);

/**
 * @route  DELETE /api/interview/:id
 * @desc   Delete report by ID
 * @access Private
 */
interviewRouter.delete("/:id", authUser, deleteReportController);

export default interviewRouter;
