/**
 * UI state checks that do not need the AI engine:
 * empty-form validation, file-type validation, loading/disabled state.
 * Usage: NODE_PATH=<global node_modules> node tools/ui-states.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    `${process.env.APPDATA}\\npm\\node_modules\\playwright`,
);

const BASE = process.env.APP_URL || "http://localhost:5173";
const stamp = Date.now();
const email = `ui+${stamp}@example.com`;
const password = "TestPass123!";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await page.fill("#name", `ui${stamp}`);
await page.fill("#email", email);
await page.fill("#password", password);
await page.fill("#confirmPassword", password);
await Promise.all([
  page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
console.log("after register url:", page.url());

await page.waitForSelector("#job-description", { timeout: 20000 });

// 1. empty form
await page.click('button[type="submit"]');
await page.waitForSelector('[role="alert"]', { timeout: 5000 });
const alertText = await page.locator('[role="alert"]').first().innerText();
console.log("empty submit alert:", alertText.replace(/\n/g, " | "));
console.log(
  "job field still filled:", await page.inputValue("#job-description"),
);

// 2. wrong file type
const tmp = path.join(os.tmpdir(), "not-a-resume.txt");
fs.writeFileSync(tmp, "plain text");
await page.setInputFiles("#resume", tmp);
await page.click('button[type="submit"]');
await page.waitForTimeout(500);
const fileError = await page.locator("#resume-error").innerText();
console.log("file type error:", fileError);

// 3. loading state + duplicate submission guard (network is intercepted so no
// real generation happens here)
await page.route("**/api/interview", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  await route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({ message: "ok", report: { candidateName: "T" } }),
  });
});

await page.fill("#job-description", "Frontend engineer role");
await page.fill("#self-description", "I build React apps");
await page.setInputFiles(
  "#resume",
  process.env.RESUME_PATH ||
    "C:/Users/HASSNAIN/Downloads/Documents/Hassnain_Shabbir_Resume.pdf",
);
await page.click('button[type="submit"]');
await page.waitForSelector("text=Generating report", { timeout: 5000 });
const disabled = await page.locator('button[type="submit"]').isDisabled();
console.log("submit disabled while generating:", disabled);
await page.waitForSelector(".report-result", { timeout: 15000 });
console.log("report rendered after mocked response: true");

console.log("console errors:", consoleErrors.length ? consoleErrors : "none");
await browser.close();
