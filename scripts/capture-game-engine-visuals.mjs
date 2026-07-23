import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:5173";
const outputDir = path.resolve(
  process.argv[3] ?? "test-artifacts/game-engine-visuals",
);
const scenarios = [
  {
    name: "desktop-playing",
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    complete: false,
  },
  {
    name: "mobile-playing",
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    complete: false,
  },
  {
    name: "mobile-playing-dark",
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    complete: false,
  },
  {
    name: "desktop-completed",
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    complete: true,
  },
];
const answers = ["hue", "hai van", "da nang", "hoi an", "my son", "nha trang"];

fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];

for (const scenario of scenarios) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    colorScheme: scenario.colorScheme,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${scenario.name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${scenario.name}: ${String(error)}`));
  await page.goto(url, { waitUntil: "networkidle" });

  if (scenario.complete) {
    for (const answer of answers) {
      await page.locator("#journey-typing-input").fill(answer);
      await page.evaluate(() => window.advanceTime?.(1_000));
    }
  } else {
    await page.locator("#journey-typing-input").fill("hue");
    await page.evaluate(() => window.advanceTime?.(2_000));
    await page.locator("#journey-typing-input").fill("hai");
  }

  await page.screenshot({
    path: path.join(outputDir, `${scenario.name}.png`),
    fullPage: true,
  });
  fs.writeFileSync(
    path.join(outputDir, `${scenario.name}.json`),
    await page.evaluate(() => window.render_game_to_text?.() ?? "null"),
  );
  await context.close();
}

await browser.close();
if (errors.length > 0) {
  fs.writeFileSync(path.join(outputDir, "errors.json"), JSON.stringify(errors, null, 2));
  throw new Error(errors.join("\n"));
}
