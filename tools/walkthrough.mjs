import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const BASE = "http://localhost:3500";
const VO = process.env.VO || "/home/hermes/kavach-health-audit/trailer/vo";
const OUT = process.env.OUTDIR || "/home/hermes/kavach-health-audit/trailer/walk_frames";
const FINAL = process.env.FINAL || "/home/hermes/kavach-health-audit/trailer/kavach-walkthrough.mp4";
const FPS = 10;
const PAD = 0.55; // breathing room after each line

const manifest = JSON.parse(fs.readFileSync(path.join(VO, "manifest.json"), "utf8"));
const segs = manifest.walk;
const durations = segs.map((s) => s.dur + PAD);
const starts = [];
let acc = 0;
for (const d of durations) {
  starts.push(acc);
  acc += d;
}
const total = acc;
console.log("total", total.toFixed(2), "starts", starts.map((s) => s.toFixed(2)).join(","));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--headless=old", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  executablePath: "/home/hermes/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 540, height: 1170 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

let n = 0;
async function hold(seconds, action) {
  if (action) await action();
  const frames = Math.round(seconds * FPS);
  for (let i = 0; i < frames; i++) {
    const t0 = Date.now();
    await page.screenshot({ path: path.join(OUT, `f${String(n).padStart(5, "0")}.png`) });
    n++;
    const el = Date.now() - t0;
    if (el < 1000 / FPS) await page.waitForTimeout(1000 / FPS - el);
  }
  console.log(`step done, ${n} frames`);
}

const click = (name) => async () => {
  await page.getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(500);
};

// 1 — home
await hold(durations[0], async () => {
  await page.waitForTimeout(400);
});

// 2 — open case, bill
await hold(durations[1], async () => {
  await page.getByText("Nandi Ridge Multispeciality").first().click();
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo({ top: 430, behavior: "smooth" }));
  await page.waitForTimeout(700);
});

// 3 — audit, move the room cap
await hold(durations[2], async () => {
  await click("Audit")();
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const el = document.querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, "6500");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(900);
});

// 4 — shield matrix
await hold(durations[3], async () => {
  await page.evaluate(() => window.scrollTo({ top: 1150, behavior: "smooth" }));
  await page.waitForTimeout(900);
});

// 5 — dispute, kannada, hospital letter
await hold(durations[4], async () => {
  await click("Dispute")();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "ಕನ್ನಡ" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /The hospital/ }).click();
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo({ top: 620, behavior: "smooth" }));
  await page.waitForTimeout(600);
});

// 6 — desk mode
await hold(durations[5], async () => {
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Desk mode/i }).first().click();
  await page.waitForTimeout(900);
});

// 7 — dossier + payment
await hold(durations[6], async () => {
  await page.getByRole("button", { name: "Close desk mode" }).click();
  await page.waitForTimeout(400);
  await click("Dossier")();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /run a demo|demo simulation/i }).first().click();
  await page.waitForTimeout(1600);
});

await browser.close();

// ── audio: place each segment at its step start ──────────────────────
const inputs = [];
const filters = [];
const mixes = [];
segs.forEach((s, i) => {
  inputs.push("-i", s.path);
  const ms = Math.round(starts[i] * 1000);
  filters.push(`[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`);
  mixes.push(`[a${i}]`);
});

const out = FINAL;
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-framerate", String(FPS), "-i", path.join(OUT, "f%05d.png"),
  ...inputs,
  "-filter_complex",
  `${filters.join(";")};${mixes.join("")}amix=inputs=${segs.length}:normalize=0:dropout_transition=0[aout]`,
  "-map", "0:v", "-map", "[aout]",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
  "-c:a", "aac", "-b:a", "160k", "-ac", "2",
  "-t", total.toFixed(2), "-movflags", "+faststart", out,
], { stdio: "inherit" });

console.log("WROTE", out, fs.statSync(out).size);
