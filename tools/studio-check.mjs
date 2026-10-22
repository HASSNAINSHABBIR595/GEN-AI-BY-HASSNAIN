/**
 * Opens a saved report from the report studio and checks that every section
 * returned by the backend is rendered.
 * Usage: node tools/studio-check.mjs <email> <password>
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    `${process.env.APPDATA}\\npm\\node_modules\\playwright`,
);

const BASE = process.env.APP_URL || "http://localhost:5173";
const [email, password] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", password);
await Promise.all([
  page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
console.log("logged in, url:", page.url());

await page.goto(`${BASE}/app/report-studio`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
console.log("studio body:", (await page.locator("body").innerText()).slice(0, 600));
await page.waitForSelector("text=Open report", { timeout: 20000 });
await page.getByRole("button", { name: "Open report" }).first().click();
await page.waitForSelector(".report-result", { timeout: 30000 });

const reportText = await page.locator(".report-result").innerText();
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
const raw = /\[object Object\]|undefined/.test(reportText);

console.log("report length:", reportText.length);
console.log("missing sections:", missing.length ? missing : "none");
console.log("raw placeholders:", raw);
console.log("console errors:", consoleErrors.length ? consoleErrors : "none");

await page.screenshot({ path: "tools/studio-report.png", fullPage: true });
await browser.close();

if (missing.length || raw) {
  console.log("\nRESULT: FAILED");
  process.exit(1);
}
console.log("\nRESULT: PASSED");
