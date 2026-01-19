import { test, expect } from "@playwright/test";

const buildSseBody = (events: Array<Record<string, unknown>>) =>
  events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");

const campgroundResponse = {
  id: "ckx0000000000000000000000",
  organizationId: "ckx0000000000000000000001",
  name: "Mock Campground",
  slug: "mock-camp",
  description: "A test campground for chat.",
  city: "Testville",
  state: "CA",
  country: "US",
  address1: "123 Test Road",
  postalCode: "12345",
  timezone: "America/Los_Angeles",
  photos: [],
  events: [],
  siteClasses: [],
};

test.describe("Public booking chat", () => {
  test("sends a public booking message and renders the response", async ({ page }) => {
    await page.route("**/api/public/campgrounds/mock-camp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(campgroundResponse),
      });
    });
    await page.route("**/api/public/campgrounds/*/value-stack", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });
    await page.route("**/api/chat/stream", async (route) => {
      const events = [
        { type: "text", value: "We have sites open next weekend." },
        { type: "done" },
      ];
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: buildSseBody(events),
      });
    });

    await page.goto("/park/mock-camp");

    const launcher = page.getByLabel("Open Keepr Host chat");
    await expect(launcher).toBeVisible({ timeout: 15000 });
    await launcher.click();

    await page.getByRole("button", { name: "Chat with Keepr Host" }).click();

    const input = page.getByPlaceholder(/Share dates, guests, rig, and amenities/i);
    await input.fill("What is availability next weekend?");
    await input.press("Enter");

    await expect(page.getByText("We have sites open next weekend.")).toBeVisible();
  });
});
