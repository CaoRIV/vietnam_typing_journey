import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:5173";
const outputDir = path.resolve(process.argv[3] ?? "test-artifacts/map-visuals");

const variants = [
  {
    name: "mobile-portrait-light",
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    fullPage: true,
  },
  {
    name: "mobile-landscape-light",
    viewport: { width: 844, height: 390 },
    colorScheme: "light",
    fullPage: true,
  },
  {
    name: "mobile-portrait-dark-reduced-motion",
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    reducedMotion: "reduce",
    fullPage: true,
  },
];

fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];

for (const variant of variants) {
  const context = await browser.newContext({
    viewport: variant.viewport,
    colorScheme: variant.colorScheme,
    reducedMotion: variant.reducedMotion ?? "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${variant.name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${variant.name}: ${String(error)}`));

  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => window.setJourneyProgress?.(0.55));
  await page.screenshot({
    path: path.join(outputDir, `${variant.name}.png`),
    fullPage: variant.fullPage,
  });

  const state = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  fs.writeFileSync(path.join(outputDir, `${variant.name}.json`), state ?? "null");
  await context.close();
}

await browser.close();

if (errors.length > 0) {
  fs.writeFileSync(path.join(outputDir, "errors.json"), JSON.stringify(errors, null, 2));
  throw new Error(errors.join("\n"));
}
