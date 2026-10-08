import { expect, test, type Locator, type Page } from "@playwright/test";
import { openMap } from "./support/map";

const personal = process.env.NEXT_PUBLIC_APP_MODE === "personal";

async function showLayersIfNeeded(page: import("@playwright/test").Page) {
  const sheet = page.getByRole("complementary", { name: "Map sheet" });
  if (await sheet.isHidden()) {
    await page.getByRole("button", { name: "Layers", exact: true })
      .evaluate((button: HTMLButtonElement) => button.click());
  }
}

async function selectHubbardParcels(
  page: Page,
  canvas: Locator,
  beforeSelection?: () => Promise<void>,
) {
  await expect(page.locator(".status")).toContainText("Hubbard");
  await expect.poll(async () => Number(await canvas.getAttribute("data-camera-height-meters")))
    .toBeLessThanOrEqual(35_000);
  await showLayersIfNeeded(page);
  await page.getByRole("button", { name: /^Parcels\b/ }).click();
  const parcels = page.locator("#layer-section-parcels")
    .getByRole("checkbox", { name: /^Hubbard tax parcels/ });
  await beforeSelection?.();
  if (await parcels.isChecked()) await parcels.uncheck();
  await parcels.check();
  await expect(parcels).toBeChecked();
  return parcels;
}

async function mockHubbardFeatureFailure(
  page: import("@playwright/test").Page,
  status: () => number,
  onQuery: () => void,
) {
  await page.route("**/api/gis-proxy/hubbard/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/FeatureServer/0/query")) {
      onQuery();
      const responseStatus = status();
      if (responseStatus >= 400) {
        return route.fulfill({ status: responseStatus, body: "Feature request failed" });
      }
      return route.fulfill({
        status: responseStatus,
        json: { type: "FeatureCollection", features: [] },
      });
    }
    if (url.pathname.endsWith("/FeatureServer/0")) {
      return route.fulfill({ json: { maxRecordCount: 1000, objectIdField: "OBJECTID" } });
    }
    return route.fulfill({ status: 200, body: "" });
  });
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

  test("desktop/mobile: a failed feature query with an expired session prompts sign-in and retries", async ({ page }) => {
    test.skip(!personal, "Expired Access handling exists only in the personal build.");
    let sessionStatus = 204;
    let featureStatus = 401;
    let probeCount = 0;
    let featureQueries = 0;

    const canvas = await openMap(page, async (currentPage) => {
      await currentPage.route("**/api/session", (route) => {
        probeCount += 1;
        return route.fulfill({ status: sessionStatus });
      });
      await mockHubbardFeatureFailure(currentPage, () => featureStatus, () => { featureQueries += 1; });
    });

    await selectHubbardParcels(page, canvas, async () => {
      await expect.poll(() => probeCount).toBeGreaterThan(0);
      sessionStatus = 401;
    });
    const dialog = page.getByRole("dialog", { name: "Your sign-in session expired" });
    await expect.poll(() => featureQueries).toBeGreaterThan(0);
    await expect(dialog).toBeVisible();

    const failedQueries = featureQueries;
    sessionStatus = 204;
    featureStatus = 200;
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(dialog).toBeHidden();
    await expect.poll(() => featureQueries).toBeGreaterThan(failedQueries);
  });

  test("desktop/mobile: a proxied feature 404 does not prompt when the session probe succeeds", async ({ page }) => {
    test.skip(!personal, "The personal build checks Access after a feature request failure.");
    let probeCount = 0;
    let featureQueries = 0;
    const canvas = await openMap(page, async (currentPage) => {
      await currentPage.route("**/api/session", (route) => {
        probeCount += 1;
        return route.fulfill({ status: 204 });
      });
      await mockHubbardFeatureFailure(currentPage, () => 404, () => { featureQueries += 1; });
    });

    await selectHubbardParcels(page, canvas);
    await expect.poll(() => featureQueries).toBeGreaterThan(0);
    await expect.poll(() => probeCount).toBeGreaterThan(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the public build never probes or shows the dialog for a failed feature query", async ({ page }) => {
    test.skip(personal, "The public build is the one that must never probe.");
    let probeCount = 0;
    let featureQueries = 0;
    const canvas = await openMap(page, async (currentPage) => {
      await currentPage.route("**/api/session", (route) => {
        probeCount += 1;
        return route.fulfill({ status: 401 });
      });
      await mockHubbardFeatureFailure(currentPage, () => 401, () => { featureQueries += 1; });
    });

    await selectHubbardParcels(page, canvas);
    await expect.poll(() => featureQueries).toBeGreaterThan(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(probeCount).toBe(0);
  });
});
