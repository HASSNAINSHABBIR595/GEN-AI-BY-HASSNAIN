/**
 * Checks a rendered report for rendering artefacts:
 *   - "[object Object]"
 *   - a value that renders as "undefined" or "null" (a bare word or after a label)
 *
 * The words inside a model answer ("undefined" in a JavaScript explanation,
 * for example) are legitimate content and are not reported.
 *
 * Usage: node tools/artifact-check.mjs <email> <password>
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
const page = await browser.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", password);
await Promise.all([
  page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);

await page.goto(`${BASE}/app/report-studio`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Open report" }).first().click();
await page.waitForSelector(".report-result", { timeout: 30000 });

const text = await page.locator(".report-result").innerText();
const lines = text.split("\n").map((line) => line.trim());

const artefacts = [];

lines.forEach((line, index) => {
  if (line.includes("[object Object]")) {
    artefacts.push(`line ${index}: ${line.slice(0, 80)}`);
    return;
  }

  // A value that is only "undefined" or "null".
  if (/^(undefined|null)$/i.test(line)) {
    artefacts.push(`line ${index}: ${line}`);
    return;
  }

  // A label followed by an empty value ("Score: undefined").
  if (/:\s*(undefined|null)\s*$/i.test(line)) {
    artefacts.push(`line ${index}: ${line.slice(0, 80)}`);
  }
});

console.log("report length:", text.length);
console.log("rendering artefacts:", artefacts.length ? artefacts : "none");

await browser.close();

if (artefacts.length) {
  console.log("\nRESULT: FAILED");
  process.exit(1);
}
console.log("\nRESULT: PASSED");
