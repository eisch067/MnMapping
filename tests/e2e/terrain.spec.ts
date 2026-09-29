import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { openMap } from "./support/map";

const personalBuild = process.env.NEXT_PUBLIC_APP_MODE === "personal";

async function stubDem(page: Page) {
  await page.route("**/api/gis-proxy/mngeo-dem/**/getSamples?*", async (route) => {
    const url = new URL(route.request().url());
    const geometry = JSON.parse(url.searchParams.get("geometry") ?? "{}") as { points?: number[][] };
    await route.fulfill({
      json: {
        samples: (geometry.points ?? []).map(([longitude], locationId) => ({
          locationId,
          value: 300 + (longitude + 96) * 1_000,
        })),
      },
    });
  });
}

async function placeVertex(
  canvas: Locator,
  xRatio: number,
  yRatio: number,
  testInfo: TestInfo,
  expectedCount: number,
) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Map canvas is not visible.");
  const position = { x: box.width * xRatio, y: box.height * yRatio };
  await expect(async () => {
    if (testInfo.project.name === "mobile") await canvas.tap({ position });
    else await canvas.click({ position });
    await expect(canvas.page().getByText(`${expectedCount} ${expectedCount === 1 ? "vertex" : "vertices"}`, { exact: true })).toBeVisible();
  }).toPass();
}

for (const dimension of ["Direct", "Ground"] as const) {
  test(`saves and reloads a line with ${dimension.toLowerCase()} distance`, async ({ page }, testInfo) => {
    test.skip(!personalBuild, "DEM measurements are excluded from the public build.");
    const installDemStub = (currentPage: Page) => stubDem(currentPage);
    const canvas = await openMap(page, installDemStub);
    await page.getByRole("navigation", { name: "Map tools" })
      .getByRole("button", { name: "Add", exact: true }).click();
    const sheet = page.getByRole("complementary", { name: "Map sheet" });
    await sheet.getByRole("button", { name: "Line", exact: true }).click();
    await sheet.getByRole("button", { name: dimension, exact: true }).click();
    await expect(sheet.locator(".measurement-disclosure")).toContainText("0.5 m NAVD88 lidar DEM");
    await placeVertex(canvas, 0.58, 0.45, testInfo, 1);
    await placeVertex(canvas, 0.72, 0.53, testInfo, 2);
    await expect(sheet.getByText(/mi$/)).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept(`${dimension} route`));
    await sheet.getByRole("button", { name: "Finish" }).click();

    const reloadedCanvas = await openMap(page, installDemStub);
    await page.getByRole("navigation", { name: "Map tools" })
      .getByRole("button", { name: "My Data", exact: true }).click();
    const reloadedSheet = page.getByRole("complementary", { name: "Map sheet" });
    await expect(reloadedSheet.getByText(`${dimension} route`, { exact: true })).toBeVisible();
    await reloadedSheet.getByRole("button", { name: "Edit shape" }).click();
    await expect(reloadedSheet.getByRole("button", { name: dimension, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(reloadedSheet.getByText(/mi$/)).toBeVisible();
    await expect(reloadedCanvas).toBeVisible();
  });
}

test("shows and remembers the first-use guide and live compass in the personal build", async ({ page }) => {
  test.skip(!personalBuild, "This check is for the personal build.");
  await openMap(page);
  await expect(page.getByLabel("First-use terrain guide")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset compass to north" })).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByLabel("First-use terrain guide")).toHaveCount(0);
  await openMap(page);
  await expect(page.getByLabel("First-use terrain guide")).toHaveCount(0);
});

async function selectMapSheet(page: Page, name: string, id: string) {
  await page
    .getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name, exact: true })
    .dispatchEvent("click");
  await expect(page.locator(`#sheet-${id}`)).toBeVisible();
}

test("keeps the Terrain sheet 3D terrain switch in sync with Layers", async ({ page }) => {
  test.skip(!personalBuild, "3D terrain is available only in the personal build.");
  await openMap(page);

  await selectMapSheet(page, "Terrain", "terrain");
  const terrainSheet = page.getByRole("complementary", { name: "Map sheet" });
  const terrainSwitch = terrainSheet.getByRole("checkbox", { name: "3D terrain" });
  await expect(terrainSwitch).not.toBeChecked();
  await terrainSwitch.check();

  await selectMapSheet(page, "Layers", "layers");
  const layersSheet = page.getByRole("complementary", { name: "Map sheet" });
  await layersSheet.getByRole("button", { name: /^3D terrain/ }).click();
  const layerSwitch = layersSheet.locator("#layer-section-terrain").getByRole("checkbox", { name: /3D Terrain/ });
  await expect(layerSwitch).toBeChecked();
  await layerSwitch.uncheck({ force: true });

  await selectMapSheet(page, "Terrain", "terrain");
  await expect(terrainSwitch).not.toBeChecked();

  await selectMapSheet(page, "Layers", "layers");
  await layerSwitch.check({ force: true });
  await selectMapSheet(page, "Terrain", "terrain");
  await expect(terrainSwitch).toBeChecked();
});

test("runs a local viewshed and shows its disclosure and temporary-save label", async ({ page }, testInfo) => {
  test.skip(!personalBuild, "Terrain analysis is personal-build only.");
  const canvas = await openMap(page, stubDem);
  await page.getByRole("navigation", { name: "Map tools" }).getByRole("button", { name: "Terrain" }).click();
  const sheet = page.getByRole("complementary", { name: "Map sheet" });
  await expect(sheet.getByRole("button", { name: "Threshold" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Viewshed" })).toHaveAttribute("aria-pressed", "true");
  const terrainSwitch = sheet.getByRole("checkbox", { name: "3D terrain" });
  await expect(terrainSwitch).not.toBeChecked();
  await expect(sheet.locator(".terrain-accuracy-note")).toBeVisible();
  await sheet.getByRole("button", { name: "Place observer on map" }).click();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Map canvas is not visible.");
  const position = { x: box.width * 0.8, y: box.height * 0.3 };
  await expect(async () => {
    if (testInfo.project.name === "mobile") await canvas.tap({ position });
    else await canvas.click({ position });
    await expect(sheet.getByRole("button", { name: "Place observer on map" })).toBeVisible();
  }).toPass();
  await expect(async () => {
    const errors = await sheet.getByRole("alert").allTextContents();
    if (errors.length) throw new Error(`Viewshed failed: ${errors.join("; ")}`);
    await expect(sheet.getByRole("img", { name: "Computed viewshed result" })).toBeVisible();
  }).toPass();
  await expect(sheet.getByText(/temporary on this device only · not synced, exported, or a My Data item/)).toBeVisible();
  await sheet.getByRole("button", { name: "Save analysis" }).click();
  await expect(sheet.getByText("Saved temporarily on this device.")).toBeVisible();
  await sheet.getByRole("slider", { name: /Range:/ }).fill("1000");
  await expect(sheet.getByRole("alert")).toContainText("40,401 cells");
});

test("keeps terrain analysis and DEM measurement controls out of the public build", async ({ page }) => {
  test.skip(personalBuild, "This check is for the public build.");
  await openMap(page);
  await page.getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "Add", exact: true }).click();
  const sheet = page.getByRole("complementary", { name: "Map sheet" });
  await sheet.getByRole("button", { name: "Line", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Direct", exact: true })).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Ground", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("First-use terrain guide")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reset compass to north" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Map tools" }).getByRole("button", { name: "Terrain" })).toHaveCount(0);
  const thresholdResponse = await page.request.get("/api/terrain/threshold?minimum=1450");
  expect(thresholdResponse.status()).toBe(404);
  const sampleResponse = await page.request.get(
    "/api/gis-proxy/mngeo-dem/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer/getSamples?f=json",
  );
  expect(sampleResponse.status()).toBe(404);
});
