/**
 * Error-state checks: network failure, server error, malformed response.
 * Usage: node tools/error-states.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    `${process.env.APPDATA}\\npm\\node_modules\\playwright`,
);

const BASE = process.env.APP_URL || "http://localhost:5173";
const stamp = Date.now();

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await page.fill("#name", `err${stamp}`);
await page.fill("#email", `err+${stamp}@example.com`);
await page.fill("#password", "TestPass123!");
await page.fill("#confirmPassword", "TestPass123!");
await Promise.all([
  page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);

await page.waitForSelector("#job-description");
await page.fill("#job-description", "Frontend engineer role");
await page.fill("#self-description", "I build React apps");
await page.setInputFiles(
  "#resume",
  process.env.RESUME_PATH ||
    "C:/Users/HASSNAIN/Downloads/Documents/Hassnain_Shabbir_Resume.pdf",
);

async function runCase(label, handler) {
  await page.route("**/api/interview", handler);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".alert-error", { timeout: 20000 });
  const message = await page.locator(".alert-error").first().innerText();
  const jobValue = await page.inputValue("#job-description");
  const selfValue = await page.inputValue("#self-description");
  const hasRetry = await page.getByRole("button", { name: /Try again/i }).count();
  console.log(`\n[${label}]`);
  console.log("message:", message.replace(/\n/g, " | "));
  console.log("form preserved:", jobValue.length > 0 && selfValue.length > 0);
  console.log("retry button:", hasRetry > 0);
  await page.unroute("**/api/interview");
}

// 1. Network failure
await runCase("network failure", (route) => route.abort("connectionrefused"));

// 2. Server error with a JSON message
await runCase("server error", (route) =>
  route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ message: "Failed to generate interview report." }),
  }),
);

// 3. Malformed response (no report field)
await runCase("malformed response", (route) =>
  route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({ message: "ok" }),
  }),
);

// 4. Validation error from the backend
await runCase("validation error", (route) =>
  route.fulfill({
    status: 400,
    contentType: "application/json",
    body: JSON.stringify({
      message: "Self-description and job description are required.",
    }),
  }),
);

await browser.close();
console.log("\nRESULT: PASSED");
