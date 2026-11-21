import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIR = "/home/hermes/kavach-health-audit/trailer";
const FRAMES = path.join(DIR, "frames");
const FPS = 30;

fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--headless=old", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  executablePath:
    process.env.CHROME_PATH ||
    "/home/hermes/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
});

const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1,
});

await page.goto("file://" + path.join(DIR, "index.html"), { waitUntil: "load" });
await page.waitForFunction("window.__ready === true", { timeout: 30000 });
await page.waitForTimeout(500);

const duration = await page.evaluate("window.__duration");
const total = Math.ceil(duration * FPS);

for (let i = 0; i < total; i++) {
  const t = i / FPS;
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.screenshot({
    path: path.join(FRAMES, `f${String(i).padStart(4, "0")}.png`),
    type: "png",
  });
  if (i % 60 === 0) process.stdout.write(`frame ${i}/${total}\n`);
}

await browser.close();

const out = path.join(DIR, "kavach-trailer.mp4");
execFileSync("ffmpeg", [
  "-y",
  "-framerate", String(FPS),
  "-i", path.join(FRAMES, "f%04d.png"),
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-crf", "18",
  "-preset", "medium",
  "-movflags", "+faststart",
  out,
], { stdio: "inherit" });

console.log("WROTE", out, fs.statSync(out).size, "bytes");
