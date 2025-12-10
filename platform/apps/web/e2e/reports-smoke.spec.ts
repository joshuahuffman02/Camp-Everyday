import { test, expect } from "@playwright/test";

test.describe("Reports page smoke", () => {
  test("loads without errors and renders tabs", async ({ page }) => {
    await page.goto("/");
    // Navigate to reports via direct URL to keep the smoke fast.
    await page.goto("/reports");

    // Basic load check: main heading and key tab buttons present.
    await expect(page.getByRole("heading", { name: /reports/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /daily/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /revenue/i })).toBeVisible();

    // Switch to a tab to ensure client hooks run without runtime errors.
    await page.getByRole("button", { name: /revenue/i }).click();
    await expect(page.getByText(/revenue overview/i)).toBeVisible();
  });
});

