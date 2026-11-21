import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3100";
const browser = await chromium.launch({
  headless: false,
  args: ["--headless=old", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  executablePath:
    process.env.CHROME_PATH ||
    "/home/hermes/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const fonts = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  const nav = document.querySelector("nav");
  const mono = document.querySelector(".font-mono, .tnum");
  return {
    displayLoaded: document.fonts.check('400 37px Newsreader'),
    sansLoaded: document.fonts.check("400 13px Inter"),
    monoLoaded: document.fonts.check("400 13px 'JetBrains Mono'"),
    h1Family: h1 ? getComputedStyle(h1).fontFamily : null,
    h1Size: h1 ? getComputedStyle(h1).fontSize : null,
    navFamily: nav ? getComputedStyle(nav).fontFamily : null,
    monoFamily: mono ? getComputedStyle(mono).fontFamily : null,
    faceCount: document.fonts.size,
  };
});
console.log("FONTS", JSON.stringify(fonts, null, 1));

const targets = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll("button, a, input[type=file], label").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.height < 44 && r.height > 0) {
      bad.push({
        tag: el.tagName,
        h: Math.round(r.height),
        text: (el.textContent || "").trim().slice(0, 34),
      });
    }
  });
  return bad;
});
console.log("TAP_TARGETS_UNDER_44", JSON.stringify(targets.slice(0, 12)));

const overflow = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("h1,h2,h3,p,span,div").forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      const cs = getComputedStyle(el);
      if (cs.overflow === "visible" && cs.textOverflow !== "ellipsis") {
        out.push({
          tag: el.tagName,
          sw: el.scrollWidth,
          cw: el.clientWidth,
          text: (el.textContent || "").trim().slice(0, 40),
        });
      }
    }
  });
  return out.slice(0, 8);
});
console.log("TEXT_OVERFLOW", JSON.stringify(overflow));

// Doughnut render check
await page.getByRole("button", { name: "Audit", exact: true }).first().click();
await page.waitForTimeout(900);
const chart = await page.evaluate(() => {
  const svg = document.querySelector("svg.recharts-surface");
  if (!svg) return { found: false };
  const paths = [...svg.querySelectorAll("path.recharts-sector")];
  return {
    found: true,
    sectors: paths.length,
    fills: paths.map((p) => p.getAttribute("fill")),
    box: svg.getBoundingClientRect().toJSON(),
  };
});
console.log("CHART", JSON.stringify(chart));

const docH = await page.evaluate(() => ({
  auditHeight: document.documentElement.scrollHeight,
}));
console.log("HEIGHT", JSON.stringify(docH));

await browser.close();
