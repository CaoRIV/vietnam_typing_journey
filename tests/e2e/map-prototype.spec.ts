import { expect, test } from "@playwright/test";

test("moves the vehicle from progress 0 to 1", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Tuyến miền Trung thử nghiệm" }),
  ).toBeVisible();
  await expect(page.locator("[data-stop-id]")).toHaveCount(6);

  await page.locator("#journey-play-toggle").click();
  await page.evaluate(() => window.advanceTime?.(4_000));

  const middleState = await page.evaluate(() =>
    JSON.parse(window.render_game_to_text?.() ?? "{}"),
  );
  expect(middleState.progress).toBeGreaterThanOrEqual(0.49);
  expect(middleState.progress).toBeLessThan(0.56);
  expect(middleState.vehicle.y).toBeGreaterThan(390);

  await page.evaluate(() => window.advanceTime?.(4_000));
  await expect(page.getByText("100%")).toBeVisible();
  await expect(page.getByText("Đã đến Nha Trang")).toBeVisible();

  const completedState = await page.evaluate(() =>
    JSON.parse(window.render_game_to_text?.() ?? "{}"),
  );
  expect(completedState.mode).toBe("completed");
  expect(completedState.progress).toBe(1);
  expect(completedState.nextStop).toBeNull();
});

test("keeps the map and controls usable at each viewport", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#journey-map-svg")).toBeVisible();
  await expect(page.locator("#journey-progress")).toBeVisible();
  await expect(page.locator("#journey-play-toggle")).toBeVisible();

  await page.locator("#journey-progress").fill("0.72");
  const state = await page.evaluate(() =>
    JSON.parse(window.render_game_to_text?.() ?? "{}"),
  );
  expect(state.progress).toBeCloseTo(0.72, 2);
});
