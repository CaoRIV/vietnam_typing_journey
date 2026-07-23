import { expect, test } from "@playwright/test";

const readState = async (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(window.render_game_to_text?.() ?? "{}"));

const waitForMapRenderer = async (page: import("@playwright/test").Page) => {
  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
    return state.mapRenderer !== "mapbox-loading";
  });
  return readState(page);
};

test("accepts Vietnamese variants and advances only for correct input", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#journey-typing-input");

  await input.fill("x");
  let state = await readState(page);
  expect(state.progress).toBe(0);
  expect(state.game.incorrectInputs).toBe(1);
  await expect(page.getByText("Ký tự chưa đúng. Xe đang chờ bạn sửa lại.")).toBeVisible();

  await input.fill("Huế");
  state = await readState(page);
  expect(state.mode).toBe("playing");
  expect(state.currentStop).toBe("Hải Vân");
  expect(state.game.correctInputs).toBe(3);
  expect(state.progress).toBeCloseTo(3 / 33, 3);

  await page.evaluate(() => window.advanceTime?.(2_000));
  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
    return state.game?.elapsedMs >= 2_000;
  });

  await page.locator("#journey-pause-toggle").click();
  const pausedState = await readState(page);
  await page.evaluate(() => window.advanceTime?.(5_000));
  expect((await readState(page)).game.elapsedMs).toBe(pausedState.game.elapsedMs);

  await page.locator("#journey-pause-toggle").click();
  await input.fill("hai van");
  state = await readState(page);
  expect(state.currentStop).toBe("Đà Nẵng");
});

test("plays through all six stops and creates GameResult", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("#journey-typing-input");
  const answers = ["hue", "Hải Vân", "DANANG", "hoi an", "myson", "Nha Trang"];

  for (const [index, answer] of answers.entries()) {
    await input.fill(answer);
    if (index < answers.length - 1) {
      await page.evaluate(() => window.advanceTime?.(1_000));
    }
  }

  await expect(page.getByRole("heading", { name: "Hoàn thành hành trình" })).toBeVisible();
  await expect(page.getByText("Đã đến Nha Trang")).toBeVisible();

  const state = await readState(page);
  expect(state.mode).toBe("completed");
  expect(state.progress).toBe(1);
  expect(state.result).toMatchObject({
    version: 1,
    correctInputs: 33,
    totalCharacters: 33,
  });
  expect(state.result.stopSplits).toHaveLength(6);
});

test("keeps typing and map controls usable at each viewport", async ({ page }) => {
  await page.goto("/");

  const mapState = await waitForMapRenderer(page);
  if (mapState.mapRenderer === "mapbox") {
    await expect(page.locator("#journey-mapbox-map")).toBeVisible();
    await expect(page.locator(".mapboxgl-ctrl-zoom-in")).toBeVisible();
  } else {
    await expect(page.locator("#journey-map-svg")).toBeVisible();
    await expect(page.locator("#map-zoom-in")).toBeVisible();
  }
  await expect(page.locator("#journey-typing-input")).toBeVisible();
  await expect(page.locator("#journey-reset")).toBeVisible();

  await page.locator("#journey-typing-input").fill("hu");
  const state = await readState(page);
  expect(state.progress).toBeCloseTo(2 / 33, 3);
  expect(state.game.input).toBe("hu");
});

test("zooms, pans and restores the complete Vietnam view", async ({ page }) => {
  await page.goto("/");
  const rendererState = await waitForMapRenderer(page);

  if (rendererState.mapRenderer === "mapbox") {
    const map = page.locator("#journey-mapbox-map");
    const canvas = map.locator("canvas");
    await expect(canvas).toBeVisible();
    await map.locator(".mapboxgl-ctrl-zoom-in").click();
    await map.locator(".mapboxgl-ctrl-zoom-in").click();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * 0.65, box!.y + box!.height * 0.6);
    await page.mouse.up();
    await expect(map).toBeVisible();
    return;
  }

  const map = page.locator("#journey-map-svg");
  await page.locator("#map-zoom-in").click();
  await page.locator("#map-zoom-in").click();

  const zoomedState = await readState(page);
  expect(zoomedState.mapViewport.zoom).toBeCloseTo(2.25, 2);

  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.7, box!.y + box!.height * 0.6);
  await page.mouse.up();

  const pannedState = await readState(page);
  expect(pannedState.mapViewport.x).not.toBe(zoomedState.mapViewport.x);

  await page.locator("#map-zoom-reset").click();
  const resetState = await readState(page);
  expect(resetState.mapViewport).toMatchObject({ zoom: 1, x: 0, y: 0, width: 480, height: 720 });
  await expect(map).toHaveAttribute("viewBox", "0 0 480 720");
});
