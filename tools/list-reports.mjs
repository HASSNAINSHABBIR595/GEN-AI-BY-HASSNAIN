/**
 * Logs in as an existing test user and lists / fetches saved reports.
 * Usage: node tools/list-reports.mjs <email> <password>
 */
const [email, password] = process.argv.slice(2);

const BASE = process.env.API_URL || "http://localhost:3000";

const login = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
console.log("login:", login.status);

const list = await fetch(`${BASE}/api/interview`, { headers: { Cookie: cookie } });
const body = await list.json();
console.log("reports:", list.status, "count:", body.count);
for (const report of body.reports || []) {
  console.log(` - ${report._id} ${report.targetRole} score=${report.matchScore} ${report.hiringRecommendation}`);
}

if (body.reports?.length) {
  const id = body.reports[0]._id;
  const single = await fetch(`${BASE}/api/interview/${id}`, {
    headers: { Cookie: cookie },
  });
  const singleBody = await single.json();
  const report = singleBody.report;
  console.log("\nsingle:", single.status);
  console.log(
    "sections:",
    JSON.stringify(
      {
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
        createdAt: report.createdAt,
      },
      null,
      2,
    ),
  );
}
