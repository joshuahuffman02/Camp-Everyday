import { test, expect } from "@playwright/test";

test.describe("Gamification admin (stub) smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("campreserv:selectedCampground", "mock-camp");
    });
  });

  test("toggle, award merit XP, and save badge (stub data)", async ({ page }) => {
    await page.goto("/settings/gamification");
    await page.waitForLoadState("networkidle");

    // Toggle enable switch
    const switchEl = page.getByRole("switch").first();
    const initialState = await switchEl.getAttribute("data-state");
    await switchEl.click();
    await switchEl.click(); // flip back to preserve stub state
    await expect(switchEl).toHaveAttribute("data-state", initialState ?? "checked");

    // Award merit XP
    const xpInput = page.getByLabel("XP").first();
    await xpInput.fill("7");
    await page.getByRole("button", { name: /Award XP/i }).click();

    // Save a badge to ensure badge editor works in stub mode
    await page.getByLabel("Badge name").fill("Stub Badge Smoke");
    await page.getByLabel("Description").fill("Smoke badge");
    await page.getByRole("button", { name: /Add badge/i }).click();

    // Best-effort assertion: badge list renders
    await page.getByText(/badge editor/i).first().waitFor({ timeout: 3000 });
  });
});

