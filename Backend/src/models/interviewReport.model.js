import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    intention: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    relatedSkill: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const areaForGrowthSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    explanation: { type: String, required: true },
    recommendation: { type: String, required: true },
  },
  { _id: false },
);

const skillAnalysisSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    importance: {
      type: String,
      enum: ["required", "preferred"],
      required: true,
    },
    alignment: {
      type: String,
      enum: ["strong", "partial", "weak", "not_demonstrated"],
      required: true,
    },
    evidence: { type: String, required: true },
    assessment: { type: String, required: true },
  },
  { _id: false },
);

const preparationPlanSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    focus: { type: String, required: true },
    tasks: [{ type: String }],
    expectedOutcome: { type: String, required: true },
  },
  { _id: false },
);

const interviewReportSchema = new mongoose.Schema(
  {
    // Original input
    jobDescription: {
      type: String,
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    selfDescription: {
      type: String,
      required: true,
    },

    // Candidate assessment
    candidateName: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    executiveSummary: {
      type: String,
      required: true,
    },
    hiringRecommendation: {
      type: String,
      enum: [
        "Strong Hire",
        "Proceed to Technical Interview",
        "Proceed to Technical Screening",
        "Consider with Reservations",
        "Hold",
        "Not Recommended",
      ],
      required: true,
    },

    // Skills assessment
    keyStrengths: [{ type: String }],
    areasForGrowth: [areaForGrowthSchema],
    skillsAnalysis: [skillAnalysisSchema],

    // Interview questions
    technicalQuestions: [questionSchema],
    systemDesignQuestions: [questionSchema],
    behavioralQuestions: [questionSchema],

    interviewerFocusAreas: [{ type: String }],
    preparationPlan: [preparationPlanSchema],

    // One report belongs to one user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const InterviewReportModel = mongoose.model(
  "interviewReport",
  interviewReportSchema,
);

export default InterviewReportModel;
