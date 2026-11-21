import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = process.env.OUT || "/home/hermes/kavach-health-audit/.shots";
fs.mkdirSync(OUT, { recursive: true });

const errors = [];

const browser = await chromium.launch({
  // This box cannot spawn chrome_crashpad_handler (new headless mode dies on
  // it). Old headless does not use crashpad, so we ask for it explicitly.
  headless: false,
  args: ["--headless=old", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  executablePath:
    process.env.CHROME_PATH ||
    "/home/hermes/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("requestfailed", (r) =>
  errors.push("reqfail: " + r.url() + " " + (r.failure()?.errorText ?? "")),
);

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true });

// Horizontal overflow check
const overflow = await page.evaluate(() => {
  const d = document.documentElement;
  return {
    scrollW: d.scrollWidth,
    clientW: d.clientWidth,
    bodyScroll: document.body.scrollWidth,
    widest: [...document.querySelectorAll("*")]
      .map((el) => ({
        w: el.getBoundingClientRect().width,
        tag: el.tagName + "." + (el.className?.toString?.().slice(0, 40) ?? ""),
      }))
      .filter((x) => x.w > d.clientWidth + 1)
      .slice(0, 4),
  };
});
console.log("OVERFLOW", JSON.stringify(overflow));

const tabs = ["Bill", "Audit", "Dispute", "Dossier"];
let i = 2;
for (const t of tabs) {
  await page.getByRole("button", { name: t, exact: true }).first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/0${i}-${t.toLowerCase()}.png`, fullPage: true });
  i++;
}

// Open the Bengaluru case from home and shoot desk mode
await page.getByRole("button", { name: "Scan", exact: true }).first().click();
await page.waitForTimeout(300);
await page.getByText("Nandi Ridge Multispeciality").first().click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Dispute", exact: true }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/06-dispute-bengaluru.png`, fullPage: true });

await page.getByRole("button", { name: /Desk mode/i }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/07-desk.png` });

console.log("ERRORS", JSON.stringify(errors.slice(0, 12), null, 1));
await browser.close();
