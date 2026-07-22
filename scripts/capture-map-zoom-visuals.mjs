import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:5173";
const outputDir = path.resolve(
  process.argv[3] ?? "test-artifacts/map-zoom-visuals",
);
const variants = [
  { name: "desktop-zoomed", viewport: { width: 1280, height: 720 } },
  { name: "mobile-zoomed", viewport: { width: 390, height: 844 } },
];

fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];

for (const variant of variants) {
  const context = await browser.newContext({
    viewport: variant.viewport,
    colorScheme: "light",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${variant.name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${variant.name}: ${String(error)}`));

  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.setJourneyProgress?.(0.55);
    window.setMapZoom?.(2.25);
  });
  await page.screenshot({
    path: path.join(outputDir, `${variant.name}.png`),
    fullPage: true,
  });
  fs.writeFileSync(
    path.join(outputDir, `${variant.name}.json`),
    await page.evaluate(() => window.render_game_to_text?.() ?? "null"),
  );
  await context.close();
}

await browser.close();

if (errors.length > 0) {
  fs.writeFileSync(
    path.join(outputDir, "errors.json"),
    JSON.stringify(errors, null, 2),
  );
  throw new Error(errors.join("\n"));
}
