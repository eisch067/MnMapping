import { expect, type Locator, type Page } from "@playwright/test";

const parkRapids = {
  id: "46.922100,-95.061600",
  label: "Park Rapids, Minnesota",
  latitude: 46.9221,
  longitude: -95.0616,
  county: "Hubbard",
  kind: "city",
};

// Tests must not depend on Minnesota's public services or Esri's geocoder being reachable.
async function isolateFromRemoteServices(page: Page) {
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
  await page.route("**/api/gis-proxy/**", (route) => route.abort());
  await page.route("**/api/location-search**", (route) =>
    route.fulfill({
      json: { results: [parkRapids] },
    }),
  );
}

async function searchForParkRapids(page: Page) {
  await isolateFromRemoteServices(page);
  await page.goto("/");
  const input = page.getByLabel("Enter a Minnesota location");
  const search = page.getByRole("button", { name: "Search", exact: true });
  // Text typed before React hydrates is discarded, so retry until the button reacts to it.
  await expect(async () => {
    await input.fill("Park Rapids");
    await expect(search).toBeEnabled({ timeout: 500 });
  }).toPass();
  await search.click();
  // A second visit also lists Park Rapids under recent locations, so match the search results only.
  await page
    .getByLabel("Location results")
    .getByRole("button", { name: /^Park Rapids, Minnesota/ })
    .click();
}

export function mapCanvas(page: Page): Locator {
  return page.getByLabel(/^Interactive map centered on/);
}

export async function openMap(page: Page): Promise<Locator> {
  await searchForParkRapids(page);
  const canvas = mapCanvas(page);
  await expect(canvas).toBeVisible();
  return canvas;
}
