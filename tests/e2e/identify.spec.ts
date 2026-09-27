import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { openMap } from "./support/map";

// Cesium renders in software on CI and busy machines, so a desktop-size map can take many
// seconds to start up.
test.describe.configure({ timeout: 60_000 });

const toolRow = (page: Page) => page.getByRole("navigation", { name: "Map tools" });
const sheetHost = (page: Page) => page.getByRole("complementary", { name: "Map sheet" });
const resultTitles = (page: Page) => sheetHost(page).locator(".identify-result strong");
const isDesktop = (testInfo: TestInfo) => testInfo.project.name === "desktop";

const snaFeature = {
  attributes: { unit_name: "Sedge Meadow SNA", unit_type: "Peatland", gis_acres: 120 },
};
const wmaFeature = {
  attributes: { unit_name: "Straight River WMA", subunit_name: "North", gis_area_acres: 812.5 },
};

// Answers the layer services the identify sheet queries. A point query returns the feature the
// layer holds there; the map's own viewport queries return nothing.
async function mockFeatureServices(page: Page, pointQueries: URL[] = []) {
  await page.route("**/api/gis-proxy/**", (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.includes("/FeatureServer")) return route.abort();
    if (!url.pathname.endsWith("/query")) {
      return route.fulfill({ json: { objectIdField: "OBJECTID", maxRecordCount: 1000 } });
    }
    if (url.searchParams.get("geometryType") !== "esriGeometryPoint") {
      return route.fulfill({ json: { type: "FeatureCollection", features: [] } });
    }
    pointQueries.push(url);
    const features = url.pathname.includes("bdry_scientific_and_nat_areas")
      ? [snaFeature]
      : url.pathname.includes("bdry_dnr_wildlife_mgmt_areas_pub")
        ? [wmaFeature]
        : [];
    return route.fulfill({ json: { features } });
  });
}

// The SNA layer is listed after the WMA layer, so the map draws it on top of it.
async function showSnasAndWmas(page: Page) {
  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^Public lands\b/ }).click();
  const publicLands = page.locator("#layer-section-public-land");
  await publicLands.getByRole("checkbox", { name: /^Publicly Accessible WMAs/ }).check();
  await publicLands.getByRole("checkbox", { name: /^Scientific & Natural Areas/ }).check();
  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
  await expect(sheetHost(page)).toBeHidden();
}

// The map starts up after the page hydrates, so keep clicking until it responds.
async function clickUntil(canvas: Locator, shown: Locator, tap = false) {
  await expect(async () => {
    if (tap) await canvas.tap();
    else await canvas.click();
    await expect(shown).toBeVisible({ timeout: 1000 });
  }).toPass();
}

test("a click over several visible layers lists results topmost-first", async ({ page }) => {
  const pointQueries: URL[] = [];
  const canvas = await openMap(page);
  await mockFeatureServices(page, pointQueries);
  await showSnasAndWmas(page);

  await clickUntil(canvas, resultTitles(page).first());

  await expect(resultTitles(page)).toHaveText(["Sedge Meadow SNA", "Straight River WMA"]);
  const query = pointQueries.at(-1);
  const [longitude, latitude] = (query?.searchParams.get("geometry") ?? "").split(",").map(Number);
  expect(longitude).toBeCloseTo(-95.0616, 1);
  expect(latitude).toBeCloseTo(46.9221, 1);
});

test("selecting a result opens its details, and Results goes back", async ({ page }) => {
  const canvas = await openMap(page);
  await mockFeatureServices(page);
  await showSnasAndWmas(page);
  await clickUntil(canvas, resultTitles(page).first());

  await sheetHost(page).getByRole("button", { name: /Straight River WMA/ }).click();

  await expect(sheetHost(page).getByRole("heading", { name: "Straight River WMA" })).toBeVisible();
  await expect(sheetHost(page).getByText("GIS acres")).toBeVisible();
  await expect(sheetHost(page).getByText("812.5")).toBeVisible();
  await expect(sheetHost(page).getByText(/Published as publicly accessible/)).toBeVisible();

  await sheetHost(page).getByRole("button", { name: "‹ Results" }).click();
  await expect(resultTitles(page)).toHaveCount(2);
});

test("the coordinates of the clicked point can be copied", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const canvas = await openMap(page);
  const coordinates = sheetHost(page).locator(".identify-coordinates");

  await clickUntil(canvas, coordinates);
  await sheetHost(page).getByRole("button", { name: "Copy coordinates" }).click();

  await expect(sheetHost(page).getByText("Copied")).toBeVisible();
  const shown = await coordinates.innerText();
  expect(shown).toMatch(/^46\.9\d+, -95\.0\d+$/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shown);
});

test("a touch tap identifies the point", async ({ page }, testInfo) => {
  test.skip(isDesktop(testInfo), "Tapping is a touch gesture.");
  const canvas = await openMap(page);
  await mockFeatureServices(page);
  await showSnasAndWmas(page);

  await clickUntil(canvas, resultTitles(page).first(), true);

  await expect(resultTitles(page)).toHaveText(["Sedge Meadow SNA", "Straight River WMA"]);
});

test("no Cesium infobox appears when a result is selected", async ({ page }) => {
  const canvas = await openMap(page);
  await mockFeatureServices(page);
  await showSnasAndWmas(page);
  await clickUntil(canvas, resultTitles(page).first());

  await sheetHost(page).getByRole("button", { name: /Sedge Meadow SNA/ }).click();

  await expect(sheetHost(page).getByRole("heading", { name: "Sedge Meadow SNA" })).toBeVisible();
  await expect(page.locator(".cesium-infoBox")).toHaveCount(0);
  await expect(page.locator(".cesium-selection-wrapper")).toHaveCount(0);
});

test("a saved pin is a selectable result above the layers", async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
  const canvas = await openMap(page);
  await mockFeatureServices(page);
  await showSnasAndWmas(page);
  const add = toolRow(page).getByRole("button", { name: "Add", exact: true });
  const pinTool = sheetHost(page).getByRole("button", { name: "Pin", exact: true });

  await add.click();
  await pinTool.click();
  await expect(async () => {
    await canvas.click();
    await expect(pinTool).toHaveAttribute("aria-pressed", "false", { timeout: 1000 });
  }).toPass();
  // Closing Add returns the map to inspecting. On desktop the rail may still preview the sheet
  // while the pointer is over it; the next click on the map moves the pointer away.
  await add.click();

  await clickUntil(canvas, resultTitles(page).first());

  await expect(resultTitles(page)).toHaveText([
    "Dropped pin",
    "Sedge Meadow SNA",
    "Straight River WMA",
  ]);
  await sheetHost(page).getByRole("button", { name: /Dropped pin/ }).click();
  await expect(sheetHost(page).getByText("My Data · Pin")).toBeVisible();
  await expect(sheetHost(page).getByText("Location")).toBeVisible();
});

test("a layer that cannot be checked is named without hiding the others", async ({ page }) => {
  const canvas = await openMap(page);
  await mockFeatureServices(page);
  await showSnasAndWmas(page);
  await page.route("**/bdry_dnr_wildlife_mgmt_areas_pub/FeatureServer/0/query?*", (route) =>
    route.request().url().includes("esriGeometryPoint")
      ? route.fulfill({ status: 502, body: "bad gateway" })
      : route.fulfill({ json: { type: "FeatureCollection", features: [] } }),
  );

  await clickUntil(canvas, resultTitles(page).first());

  await expect(resultTitles(page)).toHaveText(["Sedge Meadow SNA"]);
  await expect(sheetHost(page).getByRole("alert")).toContainText("Publicly Accessible WMAs");
});
