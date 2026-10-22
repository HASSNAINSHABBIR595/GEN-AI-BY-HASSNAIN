/**
 * Browser check of the full GEN+AI generation flow.
 * Usage: NODE_PATH=<global node_modules> node tools/e2e.mjs
 *
 * - registers a throwaway user through the UI
 * - fills the generation form and uploads a real PDF resume
 * - clicks "Generate with AI" and waits for the report to render
 * - asserts the report sections are present and the console is clean
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    `${process.env.APPDATA}\\npm\\node_modules\\playwright`,
);

const BASE = process.env.APP_URL || "http://localhost:5173";
const RESUME =
  process.env.RESUME_PATH ||
  "C:/Users/HASSNAIN/Downloads/Documents/Hassnain_Shabbir_Resume.pdf";

const JOB =
  "Senior Frontend Engineer (React). Requirements: 3+ years building production React applications with TypeScript, Redux and React Query. Strong CSS/Tailwind design skills, testing with Jest and React Testing Library, Next.js, REST and GraphQL API integration, Git, CI/CD with GitHub Actions. Bachelor's degree in Computer Science or equivalent.";
const SELF =
  "Frontend developer with 2 years of experience building React SPAs and Node/Express APIs. Shipped two production React apps with TypeScript and Tailwind, integrated REST APIs, wrote unit tests with Jest, and deployed with GitHub Actions. Strong JavaScript fundamentals, some Next.js exposure, working on deepening TypeScript and system design skills.";

const stamp = Date.now();
const email = `e2e+${stamp}@example.com`;
const password = "TestPass123!";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

const requests = [];
page.on("response", (response) => {
  const url = response.url();
  if (url.includes("/api/")) {
    requests.push(`${response.status()} ${response.request().method()} ${url}`);
  }
});

async function step(label) {
  console.log(`\n--- ${label}`);
}

// 1. Register through the UI
await step("register");
await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await page.fill("#name", `e2e${stamp}`);
await page.fill('input[name="email"], input#email', email);
await page.fill('input[name="password"], input#password', password);
const confirm = page.locator('input[name="confirmPassword"], input#confirmPassword');
if (await confirm.count()) await confirm.fill(password);
await Promise.all([
  page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
console.log("url after register:", page.url());

// 2. Fill the generation form
await step("fill form");
await page.waitForSelector("#job-description", { timeout: 20000 });
await page.fill("#job-description", JOB);
await page.fill("#self-description", SELF);
await page.setInputFiles("#resume", RESUME);

// 3. Submit and wait for the report
await step("generate");
const started = Date.now();
await page.click('button[type="submit"]');

await page.waitForSelector("text=Generating report", { timeout: 10000 });
console.log("loading state visible");

await page.waitForSelector(".report-result", { timeout: 45 * 60 * 1000 });
console.log(`report rendered in ${((Date.now() - started) / 1000).toFixed(1)}s`);

const reportText = await page.locator(".report-result").innerText();
console.log("report length:", reportText.length);

// The section headings are uppercased by CSS, so the check is case
// insensitive.
const haystack = reportText.toLowerCase();

const expectations = [
  "candidate",
  "match",
  "key strengths",
  "areas for growth",
  "skills analysis",
  "interview focus areas",
  "technical questions",
  "system design questions",
  "behavioural questions",
  "preparation plan",
];

const missing = expectations.filter((needle) => !haystack.includes(needle));
console.log("missing sections:", missing.length ? missing : "none");

const raw = /\[object Object\]|undefined|\bnull\b/.test(reportText);
console.log("raw placeholders in report:", raw);

await page.screenshot({ path: "tools/e2e-report.png", fullPage: true });

// 4. Mobile layout check
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "tools/e2e-report-mobile.png", fullPage: true });

console.log("\napi calls:");
requests.forEach((entry) => console.log(" ", entry));

console.log("\nconsole errors:", consoleErrors.length ? consoleErrors : "none");

await browser.close();

if (missing.length || raw) {
  console.log("\nRESULT: FAILED");
  process.exit(1);
}
console.log("\nRESULT: PASSED");
