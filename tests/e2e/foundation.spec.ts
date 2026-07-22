import { expect, test } from "@playwright/test";

test("shows the project foundation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Nền tảng đã sẵn sàng." }),
  ).toBeVisible();
  await expect(page.getByText("Vite + React + TypeScript")).toBeVisible();
});
