import { expect, test } from "@playwright/test";

test.describe("홈페이지", () => {
  test("홈페이지가 로드되어야 한다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tone Knob/);
  });

  test("네비게이션 링크가 존재해야 한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });
});
