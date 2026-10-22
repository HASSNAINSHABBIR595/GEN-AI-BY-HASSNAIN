/**
 * End-to-end API check for the GEN+AI report generation flow.
 * Usage: node tools/apitest.mjs
 *
 * 1. registers a throwaway user (cookie jar kept in memory)
 * 2. uploads a real PDF resume as multipart/form-data
 * 3. prints the generated report summary
 */
import fs from "node:fs";

const BASE = process.env.API_URL || "http://localhost:3000";
const RESUME =
  process.env.RESUME_PATH ||
  "C:/Users/HASSNAIN/Downloads/Documents/Hassnain_Shabbir_Resume.pdf";
const JOB =
  process.env.JOB_TEXT ||
  "Senior Frontend Engineer (React). Requirements: 3+ years building production React applications with TypeScript, Redux and React Query. Strong CSS/Tailwind design skills, testing with Jest and React Testing Library, Next.js, REST and GraphQL API integration, Git, CI/CD with GitHub Actions. Bachelor's degree in Computer Science or equivalent.";
const SELF =
  process.env.SELF_TEXT ||
  "Frontend developer with 2 years of experience building React SPAs and Node/Express APIs. Shipped two production React apps with TypeScript and Tailwind, integrated REST APIs, wrote unit tests with Jest, and deployed with GitHub Actions. Strong JavaScript fundamentals, some Next.js exposure, working on deepening TypeScript and system design skills.";

const stamp = Date.now();
const email = `itest+${stamp}@example.com`;

async function call(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body, cookie: response.headers.get("set-cookie") };
}

function cookieHeader(setCookie) {
  return setCookie ? setCookie.split(";")[0] : "";
}

const registered = await call("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: `itest${stamp}`,
    email,
    password: "TestPass123!",
  }),
});
console.log("register:", registered.status, JSON.stringify(registered.body));

const cookie = cookieHeader(registered.cookie);
if (!cookie) {
  console.error("No auth cookie returned; aborting.");
  process.exit(1);
}

const me = await call("/api/auth/get-me", { headers: { Cookie: cookie } });
console.log("get-me:", me.status, JSON.stringify(me.body));

if (!fs.existsSync(RESUME)) {
  console.error(`Resume not found: ${RESUME}`);
  process.exit(1);
}

const form = new FormData();
form.append("resume", new Blob([fs.readFileSync(RESUME)], { type: "application/pdf" }), "Hassnain_Shabbir_Resume.pdf");
form.append("jobDescription", JOB);
form.append("selfDescription", SELF);

console.log("POST /api/interview (this runs two local model calls, be patient)...");
const started = Date.now();
const generated = await call("/api/interview", {
  method: "POST",
  headers: { Cookie: cookie },
  body: form,
});
console.log(`generate: ${generated.status} in ${((Date.now() - started) / 1000).toFixed(1)}s`);

if (generated.status !== 201) {
  console.error(JSON.stringify(generated.body));
  process.exit(1);
}

const report = generated.body.report;
const summary = {
  _id: report._id,
  candidateName: report.candidateName,
  targetRole: report.targetRole,
  matchScore: report.matchScore,
  hiringRecommendation: report.hiringRecommendation,
  keyStrengths: report.keyStrengths?.length,
  areasForGrowth: report.areasForGrowth?.length,
  skillsAnalysis: report.skillsAnalysis?.length,
  technicalQuestions: report.technicalQuestions?.length,
  systemDesignQuestions: report.systemDesignQuestions?.length,
  behavioralQuestions: report.behavioralQuestions?.length,
  interviewerFocusAreas: report.interviewerFocusAreas?.length,
  preparationPlan: report.preparationPlan?.length,
};
console.log("report summary:", JSON.stringify(summary, null, 2));

const list = await call("/api/interview", { headers: { Cookie: cookie } });
console.log("list:", list.status, "count:", list.body.count);

const single = await call(`/api/interview/${report._id}`, { headers: { Cookie: cookie } });
console.log("single:", single.status, "id:", single.body.report?._id);

// negative cases
const noFile = new FormData();
noFile.append("jobDescription", JOB);
noFile.append("selfDescription", SELF);
const bad = await call("/api/interview", {
  method: "POST",
  headers: { Cookie: cookie },
  body: noFile,
});
console.log("missing resume ->", bad.status, JSON.stringify(bad.body));

const unauth = await call("/api/interview", { method: "GET" });
console.log("unauthenticated ->", unauth.status, JSON.stringify(unauth.body));

console.log("DONE");
