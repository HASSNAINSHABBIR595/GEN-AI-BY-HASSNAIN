import api from "../../../lib/api.js";

/**
 * Builds the multipart body for POST /api/interview.
 *
 * The backend reads exactly these field names:
 *   - resume           (PDF file)
 *   - jobDescription   (text)
 *   - selfDescription  (text)
 *
 * Do not set Content-Type manually: the browser/axios must add the
 * multipart boundary for the upload to be parsed by multer.
 */
export function buildGenerateFormData({ resume, jobDescription, selfDescription }) {
  const formData = new FormData();

  formData.append("resume", resume, resume.name);
  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);

  return formData;
}

async function generateReport({
  resume,
  jobDescription,
  selfDescription,
  signal,
}) {
  const formData = buildGenerateFormData({
    resume,
    jobDescription,
    selfDescription,
  });

  const response = await api.post("/api/interview", formData, { signal });

  return requireReport(response.data, "/api/interview");
}

async function getReports() {
  const response = await api.get("/api/interview");

  return {
    ...response.data,
    reports: Array.isArray(response.data?.reports)
      ? response.data.reports
      : [],
  };
}

async function getReport(id) {
  const response = await api.get(`/api/interview/${id}`);

  return requireReport(response.data, `/api/interview/${id}`);
}

async function deleteReport(id) {
  const response = await api.delete(`/api/interview/${id}`);

  return response.data;
}

function requireReport(payload, endpoint) {
  const report = payload?.report;

  if (!report || typeof report !== "object" || Array.isArray(report)) {
    throw new Error(
      `The server returned an unexpected response from ${endpoint}.`,
    );
  }

  return { ...payload, report };
}

export { generateReport, getReports, getReport, deleteReport };
