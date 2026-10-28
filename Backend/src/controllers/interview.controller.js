import { PDFParse } from "pdf-parse";
import generateInterviewReport from "../services/ai.service.js";
import InterviewReportModel from "../models/interviewReport.model.js";

/**
 * @name generateInterviewController
 * @description Generate AI interview report from PDF resume
 * @access private
 */
async function generateInterviewController(req, res) {
  try {
    // 1. Check uploaded resume
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload your resume as a PDF file.",
      });
    }

    // 2. Validate text fields
    const { selfDescription, jobDescription } = req.body;

    if (
      typeof selfDescription !== "string" ||
      !selfDescription.trim() ||
      typeof jobDescription !== "string" ||
      !jobDescription.trim()
    ) {
      return res.status(400).json({
        message: "Self-description and job description are required.",
      });
    }

    // 3. Extract text from PDF — ✅ Fixed import and usage
    const parser = new PDFParse({
      data: req.file.buffer,
    });

    let resumeContent;

    try {
      const pdfData = await parser.getText();
      resumeContent = pdfData.text?.trim();
    } finally {
      await parser.destroy();
    }

    if (!resumeContent) {
      return res.status(400).json({
        message:
          "Could not extract text from this PDF. Please upload a text-based PDF.",
      });
    }

    // 4. Generate AI report
    const aiReport = await generateInterviewReport({
      resume: resumeContent,
      selfDescription: selfDescription.trim(),
      jobDescription: jobDescription.trim(),
    });

    // 5. Save to MongoDB
    const savedReport = await InterviewReportModel.create({
      ...aiReport,
      resume: resumeContent,
      selfDescription: selfDescription.trim(),
      jobDescription: jobDescription.trim(),
      user: req.user.id,
    });

    // 6. Return saved report
    return res.status(201).json({
      message: "Interview report generated successfully.",
      report: savedReport,
    });
  } catch (error) {
    console.error("[Interview Controller — generate]", error);
    return res.status(500).json({
      message: "Failed to generate interview report.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * @name getAllReportsController
 * @description Get all interview reports for logged in user
 * @access private
 */
async function getAllReportsController(req, res) {
  try {
    const reports = await InterviewReportModel.find({ user: req.user.id })
      .select(
        "candidateName targetRole matchScore hiringRecommendation executiveSummary createdAt",
      )
      .sort({ createdAt: -1 }); // ✅ Latest first

    return res.status(200).json({
      message: "Reports fetched successfully.",
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("[Interview Controller — getAll]", error);
    return res.status(500).json({
      message: "Failed to fetch reports.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * @name getSingleReportController
 * @description Get single interview report by ID
 * @access private
 */
async function getSingleReportController(req, res) {
  try {
    const { id } = req.params;

    const report = await InterviewReportModel.findOne({
      _id: id,
      user: req.user.id, // ✅ Ensure user can only access their own reports
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      message: "Report fetched successfully.",
      report,
    });
  } catch (error) {
    console.error("[Interview Controller — getSingle]", error);

    // ✅ Handle invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid report ID.",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch report.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * @name deleteReportController
 * @description Delete interview report by ID
 * @access private
 */
async function deleteReportController(req, res) {
  try {
    const { id } = req.params;

    const report = await InterviewReportModel.findOneAndDelete({
      _id: id,
      user: req.user.id, // ✅ Ensure user can only delete their own reports
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      message: "Report deleted successfully.",
    });
  } catch (error) {
    console.error("[Interview Controller — delete]", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid report ID.",
      });
    }

    return res.status(500).json({
      message: "Failed to delete report.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

export {
  generateInterviewController,
  getAllReportsController,
  getSingleReportController,
  deleteReportController,
};
