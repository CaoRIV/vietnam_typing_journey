import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:5173";
const outputDir = path.resolve(
  process.argv[3] ?? "test-artifacts/game-engine-visuals",
);
const scenarios = [
  {
    name: "desktop-province-selector",
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    selector: true,
    selectedProvinceCode: "48",
  },
  {
    name: "mobile-province-selector",
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    selector: true,
    selectedProvinceCode: "48",
  },
  {
    name: "desktop-persisted-selector",
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    selector: true,
    persistedCompletion: true,
  },
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
const answers = [
  "dai noi hue",
  "chua thien mu",
  "lang khai dinh",
  "lang minh mang",
  "doi vong canh",
];

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
  const scenarioUrl = new URL(
    scenario.selector ? "/ban-do" : "/hanh-trinh/hue",
    url,
  ).toString();
  await page.goto(scenarioUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");

  if (scenario.selector) {
    if (scenario.persistedCompletion) {
      await page.locator('[data-province-hit-code="46"]').click();
      await page.locator("#open-hue-journey").click();
      for (const answer of answers) {
        await page.locator("#journey-typing-input").fill(answer);
        await page.evaluate(() => window.advanceTime?.(1_000));
      }
      await page.locator("#back-to-province-map").click();
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => typeof window.render_game_to_text === "function",
      );
    } else if (scenario.selectedProvinceCode) {
      await page
        .locator(
          `[data-province-hit-code="${scenario.selectedProvinceCode}"]`,
        )
        .click();
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
    continue;
  }

  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
    return state.mapRenderer !== "mapbox-loading";
  });
  await page.waitForTimeout(500);

  if (scenario.complete) {
    for (const answer of answers) {
      await page.locator("#journey-typing-input").fill(answer);
      await page.evaluate(() => window.advanceTime?.(1_000));
    }
  } else {
    await page.locator("#journey-typing-input").fill("dai noi hue");
    await page.evaluate(() => window.advanceTime?.(2_000));
    await page.locator("#journey-typing-input").fill("chua");
  }

  await page.waitForFunction(() => {
    const image = document.querySelector(".visited-place-image img");
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  });

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
