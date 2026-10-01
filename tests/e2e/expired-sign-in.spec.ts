import { expect, test } from "@playwright/test";
import { openMap } from "./support/map";

const personal = process.env.NEXT_PUBLIC_APP_MODE === "personal";

async function showLayersIfNeeded(page: import("@playwright/test").Page) {
  if (await page.getByRole("dialog").isVisible()) return;
  const sheet = page.getByRole("complementary", { name: "Map sheet" });
  if (await sheet.isHidden()) await page.getByRole("button", { name: "Layers", exact: true }).click();
}

test.describe("expired Access sign-in", () => {
  test("rechecks on return, closes, and retries imagery when signed in", async ({ page }) => {
    test.skip(!personal, "Expired Access handling exists only in the personal build.");
    await page.setViewportSize({ width: 390, height: 844 });
    let probeStatus = 401;
    let countyProxyRequests = 0;
    await openMap(page, async (currentPage) => {
      await currentPage.route("**/api/session", (route) =>
        route.fulfill({ status: probeStatus }),
      );
      await currentPage.route("**/api/gis-proxy/**", (route) =>
        route.fulfill({ status: 200, body: "" }),
      );
      await currentPage.route("**/api/gis-proxy/hubbard/**", (route) => {
        countyProxyRequests += 1;
        return route.fulfill({ status: 401, body: "Access login required" });
      });
    });
    await showLayersIfNeeded(page);

    const dialog = page.getByRole("dialog", { name: "Your sign-in session expired" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "Sign in" })).toBeFocused();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
    await expect.poll(() => countyProxyRequests).toBeGreaterThan(0);

    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(dialog).toBeVisible();

    const requestsBeforeRetry = countyProxyRequests;
    probeStatus = 204;
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(dialog).toBeHidden();
    await expect.poll(() => countyProxyRequests).toBeGreaterThan(requestsBeforeRetry);
  });

  test("keeps the dialog open when the returned session is still signed out and allows dismissal", async ({ page }) => {
    test.skip(!personal, "Expired Access handling exists only in the personal build.");
    let probeCount = 0;
    await openMap(page, async (currentPage) => {
      await currentPage.route("**/api/session", (route) => {
        probeCount += 1;
        return route.fulfill({ status: 401 });
      });
      await currentPage.route("**/api/gis-proxy/**", (route) =>
        route.fulfill({ status: 200, body: "" }),
      );
      await currentPage.route("**/api/gis-proxy/hubbard/**", (route) =>
        route.fulfill({ status: 401, body: "Access login required" }),
      );
    });
    await showLayersIfNeeded(page);

    const dialog = page.getByRole("dialog", { name: "Your sign-in session expired" });
    await expect(dialog).toBeVisible();
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect.poll(() => probeCount).toBeGreaterThan(1);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Dismiss" }).click();
    await expect(dialog).toBeHidden();
  });

  test("the public build never probes or shows the dialog", async ({ page }) => {
    test.skip(personal, "The public build is the one that must never probe.");
    let probeCount = 0;
    await openMap(page, async (currentPage) => {
      await currentPage.route("**/api/session", (route) => {
        probeCount += 1;
        return route.fulfill({ status: 401 });
      });
      await currentPage.route("**/api/gis-proxy/**", (route) =>
        route.fulfill({ status: 401, body: "Access login required" }),
      );
    });

    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(probeCount).toBe(0);
  });
});
