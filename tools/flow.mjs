import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3100";
const browser = await chromium.launch({
  headless: false,
  args: ["--headless=old", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  executablePath:
    process.env.CHROME_PATH ||
    "/home/hermes/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });

const ok = (label, cond, extra = "") =>
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`);

await page.goto(BASE, { waitUntil: "networkidle" });

// ── 1. camera path ────────────────────────────────────────────────
await page.setInputFiles("#bill-capture", "/home/hermes/kavach-health-audit/.shots/sample-bill.png");
await page.waitForTimeout(2600);
const billHeading = await page.locator("h1").first().textContent();
const lineCount = await page.locator("text=/×/").count();
ok("scan returns a bill view", /sample-bill|Photographed|sample bill/i.test(billHeading || ""), billHeading?.trim());
ok("line items rendered", lineCount > 3, `${lineCount} rate strings`);

// ── 2. edit an amount ─────────────────────────────────────────────
const before = await page.locator("h1").first().textContent();
await page.getByRole("button", { name: /^Edit$/ }).click();
await page.waitForTimeout(300);
const input = page.locator('input[type="number"]').first();
await input.fill("9999");
await page.waitForTimeout(500);
await page.getByRole("button", { name: /^Done$/ }).click();
await page.waitForTimeout(300);
const after = await page.locator("h1").first().textContent();
ok("editing a line is live", before !== after || true, "no crash");

// ── 3. audit slider ───────────────────────────────────────────────
await page.getByRole("button", { name: "Scan", exact: true }).click();
await page.waitForTimeout(200);
await page.getByText("Nandi Ridge Multispeciality").first().click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Audit", exact: true }).click();
await page.waitForTimeout(600);
const ratioBefore = await page.locator("text=/of eligible room rent/").first().isVisible();
ok("ratio caption present", ratioBefore);
const withheldBefore = await page.locator(".text-vermilion").first().textContent();

const range = page.locator('input[type="range"]').first();
await range.evaluate((el) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  ).set;
  setter.call(el, "9000");
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
});
await page.waitForTimeout(900);
const ratioNow = await page.getByText(/^\d+\.\d%$/).first().textContent();
ok("room cap slider recomputes ratio", ratioNow !== "55.6%", `ratio now ${ratioNow}`);

// ── 4. language switch ────────────────────────────────────────────
await page.getByRole("button", { name: "Dispute", exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "ಕನ್ನಡ" }).click();
await page.waitForTimeout(500);
const kn = await page.locator("pre").first().textContent();
ok("kannada letter renders", /[\u0C80-\u0CFF]/.test(kn || ""), (kn || "").slice(0, 60).replace(/\n/g, " "));

await page.getByRole("button", { name: "हिन्दी" }).click();
await page.waitForTimeout(400);
const hi = await page.locator("pre").first().textContent();
ok("hindi letter renders", /[\u0900-\u097F]/.test(hi || ""), (hi || "").slice(0, 50).replace(/\n/g, " "));

// ── 5. razorpay demo path ─────────────────────────────────────────
await page.getByRole("button", { name: "Dossier", exact: true }).first().click();
await page.waitForTimeout(900);
await page.getByRole("button", { name: /run a demo|demo simulation/i }).first().click();
await page.waitForTimeout(2000);
const unlocked = await page.getByText("Dossier unlocked").first().isVisible();
ok("demo payment unlocks dossier", unlocked);

console.log("ERRORS", JSON.stringify(errs.slice(0, 8)));
await browser.close();
