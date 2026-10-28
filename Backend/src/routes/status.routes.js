import express from "express";

const statusRouter = express.Router();

statusRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "GEN+AI Backend is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      interview: "/api/interview",
      status: "/api/status",
    },
  });
});

export default statusRouter;