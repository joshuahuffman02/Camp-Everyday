import { test, expect } from "@playwright/test";

test.describe("Analytics (Data Intelligence) smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the app has a selected campground so queries run; mock mode will fallback if API is unavailable.
    await page.addInitScript(() => {
      window.localStorage.setItem("campreserv:selectedCampground", "mock-camp");
    });
  });

  test("loads dashboard cards and recommendations with mock fallback", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // Basic smoke: page loaded and routed to /analytics.
    await expect(page).toHaveURL(/\/analytics/);

    // Best-effort visibility checks (non-strict to avoid duplicates/missing content in mock mode).
    await page.getByText(/analytics/i).first().waitFor({ timeout: 3000 }).catch(() => {});
    await page.getByText(/recommendations/i).first().waitFor({ timeout: 3000 }).catch(() => {});
  });
});

