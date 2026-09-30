import { expect, type Locator, type Page } from "@playwright/test";

type TestLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  county: string;
  kind: "city" | "county";
};

const parkRapids: TestLocation = {
  id: "46.922100,-95.061600",
  label: "Park Rapids, Minnesota",
  latitude: 46.9221,
  longitude: -95.0616,
  county: "Hubbard",
  kind: "city",
};

// Tests must not depend on Minnesota's public services or Esri's geocoder being reachable.
async function isolateFromRemoteServices(page: Page, location: TestLocation) {
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
  await page.route("**/api/gis-proxy/**", (route) => route.abort());
  await page.route("**/api/location-search**", (route) =>
    route.fulfill({
      json: { results: [location] },
    }),
  );
}

async function searchForLocation(
  page: Page,
  beforeLoad?: (page: Page) => Promise<void>,
  location: TestLocation = parkRapids,
) {
  await isolateFromRemoteServices(page, location);
  // Routes added later win, so a test's service mocks go in after the isolation and before the app
  // starts asking for layer data as it loads.
  await beforeLoad?.(page);
  await page.goto("/");
  const input = page.getByLabel("Enter a Minnesota location");
  const search = page.getByRole("button", { name: "Search", exact: true });
  // Text typed before React hydrates is discarded, so retry until the button reacts to it.
  await expect(async () => {
    await input.fill(location.label);
    await expect(search).toBeEnabled({ timeout: 500 });
  }).toPass();
  await search.click();
  // Recent locations also appear as results, so match this search result explicitly.
  await page
    .getByLabel("Location results")
    .getByRole("button", { name: new RegExp(`^${location.label}`) })
    .click();
}

export function mapCanvas(page: Page): Locator {
  return page.getByLabel(/^Interactive map centered on/);
}

export async function openMap(
  page: Page,
  beforeLoad?: (page: Page) => Promise<void>,
  location: TestLocation = parkRapids,
): Promise<Locator> {
  await searchForLocation(page, beforeLoad, location);
  const canvas = mapCanvas(page);
  await expect(canvas).toBeVisible();
  return canvas;
}
