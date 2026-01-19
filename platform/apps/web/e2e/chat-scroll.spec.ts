import { test, expect } from "@playwright/test";

test.describe("Chat widget scroll", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("campreserv:selectedCampground", "mock-camp");
      window.localStorage.setItem("campreserv:authToken", "test-token");
    });
  });

  test("scrolls inside chat list and exposes jump-to-latest", async ({ page }) => {
    await page.goto("/analytics");

    await page.waitForLoadState("domcontentloaded");

    const launcher = page.getByLabel("Open chat");
    await expect(launcher).toBeVisible({ timeout: 15000 });
    await launcher.click();

    const list = page.getByTestId("chat-message-list");
    await expect(list).toBeVisible();

    await list.evaluate((node) => {
      const filler = document.createElement("div");
      filler.setAttribute("data-testid", "chat-scroll-filler");
      filler.style.height = "2000px";
      filler.style.borderTop = "1px solid transparent";
      const bottom = node.lastElementChild;
      if (bottom) {
        node.insertBefore(filler, bottom);
      } else {
        node.appendChild(filler);
      }
    });

    const canScroll = await list.evaluate((node) => node.scrollHeight > node.clientHeight);
    expect(canScroll).toBeTruthy();

    await list.evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll"));
    });
    const initialScrollTop = await list.evaluate((node) => node.scrollTop);
    await list.evaluate((node) => {
      node.scrollTop = 200;
      node.dispatchEvent(new Event("scroll"));
    });
    const afterScrollTop = await list.evaluate((node) => node.scrollTop);
    expect(afterScrollTop).toBeGreaterThan(initialScrollTop);

    const jumpButton = page.getByTestId("chat-jump-to-latest");
    await expect(jumpButton).toBeVisible();
    await jumpButton.click();

    await expect
      .poll(() => list.evaluate((node) => node.scrollTop))
      .toBeGreaterThan(0);
  });
});
