import { expect, test, type Page } from "@playwright/test";
import { openMap } from "./support/map";

const personal = process.env.NEXT_PUBLIC_APP_MODE === "personal";

async function openReferenceLayers(page: Page) {
  await openMap(page);
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^Reference\b/ }).click();
  return page.locator("#layer-section-reference");
}

test("Hubbard parcels query the visible parcel-scale viewport on initial view setup", async ({ page }) => {
  const featureQueries: URL[] = [];
  const parcelScaleLocation = {
    id: "46.922100,-95.061600",
    label: "Park Rapids, Minnesota",
    latitude: 46.9221,
    longitude: -95.0616,
    county: "Hubbard",
    kind: "city" as const,
  };
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("gis-proxy")) requests.push(request.url());
  });
  const canvas = await openMap(page, async (currentPage) => {
    await currentPage.route("**/api/gis-proxy/hubbard/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/FeatureServer/0")) {
        return route.fulfill({ json: { maxRecordCount: 1000, objectIdField: "OBJECTID" } });
      }
      if (!url.pathname.endsWith("/FeatureServer/0/query")) return route.abort();
      featureQueries.push(url);
      await route.fulfill({ json: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: { hubbgis_GIS_Parcels_PIN: "TEST-PARCEL" },
          geometry: {
            type: "Polygon",
            coordinates: [[[-95.062, 46.922], [-95.061, 46.922], [-95.061, 46.923], [-95.062, 46.923], [-95.062, 46.922]]],
          },
        }],
      } });
    });
  }, parcelScaleLocation);
  await expect(page.locator(".status")).toContainText("Hubbard");
  await expect.poll(async () =>
    Number(await canvas.getAttribute("data-camera-height-meters")),
  ).toBeLessThanOrEqual(35_000);
  expect(Number(await canvas.getAttribute("data-camera-height-meters"))).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^Parcels\b/ }).click();
  const parcels = page.locator("#layer-section-parcels").getByRole("checkbox", { name: /^Hubbard tax parcels/ });

  await parcels.check();

  await expect.poll(() => featureQueries.length, { message: `Observed GIS requests: ${requests.join("\\n")}` }).toBeGreaterThan(0);
  await expect(parcels).toBeChecked();
  await expect(canvas).toBeVisible();
  await expect(page.locator(".cesium-widget-errorPanel")).toHaveCount(0);
  const query = featureQueries[0];
  expect(query.searchParams.get("geometryType")).toBe("esriGeometryEnvelope");
  expect(query.searchParams.get("inSR")).toBe("4326");
  expect(query.searchParams.get("spatialRel")).toBe("esriSpatialRelIntersects");
  const bounds = query.searchParams.get("geometry")?.split(",").map(Number);
  expect(bounds).toHaveLength(4);
  expect(bounds?.every(Number.isFinite)).toBe(true);
  expect(bounds?.[0]).toBeLessThan(bounds?.[2] ?? Number.NEGATIVE_INFINITY);
  expect(bounds?.[1]).toBeLessThan(bounds?.[3] ?? Number.NEGATIVE_INFINITY);
  expect(bounds?.[0]).toBeLessThan(-95.062);
  expect(bounds?.[1]).toBeLessThan(46.922);
  expect(bounds?.[2]).toBeGreaterThan(-95.061);
  expect(bounds?.[3]).toBeGreaterThan(46.923);
  expect(query.pathname).toContain("/FeatureServer/0/query");
});

test("a feature layer with a degenerate polygon does not stop subsequent layers", async ({ page }) => {
  test.skip(!personal, "Only the personal build issues this mocked GIS feature-layer request in the smoke-test map view.");
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  let featureQueryCount = 0;
  const canvas = await openMap(page, async (currentPage) => {
    await currentPage.route("**/api/gis-proxy/**", (route) => {
      const url = new URL(route.request().url());
      if (!url.pathname.endsWith("/query")) return route.abort();
      featureQueryCount += 1;
      return route.fulfill({ json: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: { unit_name: "Collapsed WMA" },
          geometry: { type: "Polygon", coordinates: [[[-95, 47], [-95, 47], [-95, 47], [-95, 47]]] },
        }],
      } });
    });
  });
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^Public lands\b/ }).click();
  const publicLands = page.locator("#layer-section-public-land");
  const wmas = publicLands.getByRole("checkbox", { name: /^Publicly Accessible WMAs/ });
  if (await wmas.isChecked()) await wmas.uncheck();
  await wmas.check();
  await expect.poll(() => featureQueryCount).toBeGreaterThan(0);
  await expect(publicLands.getByRole("checkbox", { name: /^Publicly Accessible WMAs/ })).toBeChecked();
  await expect(page.locator(".cesium-widget-errorPanel")).toHaveCount(0);
  await publicLands.getByRole("checkbox", { name: /^Scientific & Natural Areas/ }).check();
  await expect.poll(() => featureQueryCount).toBeGreaterThan(1);
  await expect(canvas).toBeVisible();
  await expect(page.locator(".cesium-widget-errorPanel")).toHaveCount(0);
  expect(errors.join("\n")).not.toContain("Entity corridor, ellipse, polygon or rectangle with heightReference must also have a defined height");
});

test("statewide parcels use map images beyond 35 km instead of feature queries", async ({ page }) => {
  let featureQueries = 0;
  let mapImages = 0;
  const beckerCounty = {
    id: "becker-county",
    label: "Becker County, Minnesota",
    latitude: 46.9,
    longitude: -95.6,
    county: "Becker",
    kind: "county" as const,
  };

  await openMap(page, async (currentPage) => {
    await currentPage.route("**/api/gis-proxy/mngeo-features/us_mn_state_mngeo/plan_parcels_open/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/query") && url.pathname.includes("FeatureServer")) {
        featureQueries += 1;
        await route.fulfill({ json: { type: "FeatureCollection", features: [] } });
        return;
      }
      if (url.pathname.endsWith("/export")) {
        mapImages += 1;
        await route.fulfill({ status: 200, contentType: "image/png", body: "" });
        return;
      }
      await route.fulfill({ json: {
        currentVersion: 11.5,
        capabilities: "Map,Query,Data",
        singleFusedMapCache: false,
        spatialReference: { wkid: 102100, latestWkid: 3857 },
        fullExtent: { xmin: -11000000, ymin: 5000000, xmax: -9000000, ymax: 7000000, spatialReference: { wkid: 3857 } },
        supportedImageFormatTypes: "PNG32,PNG24,PNG,JPG",
        layers: [{ id: 1, name: "Plan Parcels Open", defaultVisibility: true }],
      } });
    });
  }, beckerCounty);

  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^Parcels\b/ }).click();
  await page.getByRole("checkbox", { name: /^Becker tax parcels/ }).check();
  await expect.poll(() => mapImages).toBeGreaterThan(0);

  expect(featureQueries).toBe(0);
  await page.getByRole("checkbox", { name: /^Becker tax parcels/ }).uncheck();
  await expect(page.getByRole("checkbox", { name: /^Becker tax parcels/ })).not.toBeChecked();
});

test("category switches appear only on Parcels, Reference, and Public lands", async ({ page }) => {
  await openMap(page);
  await page.getByRole("button", { name: "Layers", exact: true }).click();

  for (const category of ["Parcels", "Reference", "Public lands"]) {
    await expect(page.getByRole("checkbox", { name: `All ${category} on` })).toBeVisible();
  }
  for (const category of ["Imagery", "Basemap", "Elevation", "DNR Recreation"]) {
    await expect(page.getByRole("checkbox", { name: `All ${category} on` })).toHaveCount(0);
  }
});

test("a layer can be toggled on and off", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  const roads = reference.getByRole("checkbox", { name: /^Roads & Highways/ });

  await expect(roads).not.toBeChecked();
  await roads.check();
  await expect(roads).toBeChecked();
  await expect(page.getByRole("button", { name: /^Reference\b.*1 on/ })).toBeVisible();

  await roads.uncheck();
  await expect(roads).not.toBeChecked();
  await expect(page.getByRole("button", { name: /^Reference\b.*0 on/ })).toBeVisible();
});

const groupControlName = "Suspend or restore Reference layers";
const suspendedReferenceHeading = /^Reference\b.*0 on · 1 suspended/;
const referenceCategorySwitch = "All Reference on";

test("a group control suspends and restores exactly the layers that were on", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  const roads = reference.getByRole("checkbox", { name: /^Roads & Highways/ });
  const places = reference.getByRole("checkbox", { name: /^Place Labels & Boundaries/ });
  const groupControl = page.getByRole("checkbox", { name: groupControlName });
  await roads.check();

  await groupControl.uncheck();

  await expect(roads).not.toBeChecked();
  await expect(page.getByRole("button", { name: suspendedReferenceHeading })).toBeVisible();

  await groupControl.check();

  await expect(roads).toBeChecked();
  await expect(places).not.toBeChecked();
  await expect(page.getByRole("button", { name: /^Reference\b.*1 on(?! ·)/ })).toBeVisible();
});

test("the Reference category switch turns every layer on and off without changing group control semantics", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  const roads = reference.getByRole("checkbox", { name: /^Roads & Highways/ });
  const places = reference.getByRole("checkbox", { name: /^Place Labels & Boundaries/ });
  const categorySwitch = page.getByRole("checkbox", { name: referenceCategorySwitch });
  const groupControl = page.getByRole("checkbox", { name: groupControlName });

  await expect(categorySwitch).toHaveAttribute("title", "Turns every layer on or off.");
  await expect(categorySwitch).not.toBeChecked();
  await categorySwitch.check();
  await expect(roads).toBeChecked();
  await expect(places).toBeChecked();
  await expect(categorySwitch).toBeChecked();

  await roads.uncheck();
  await expect(categorySwitch).not.toBeChecked();
  await expect(page.getByRole("button", { name: /^Reference\b.*1 on/ })).toBeVisible();

  await groupControl.uncheck();
  await expect(categorySwitch).not.toBeChecked();
  await expect(places).not.toBeChecked();

  await categorySwitch.check();
  await expect(roads).toBeChecked();
  await expect(places).toBeChecked();
  await expect(groupControl).toBeChecked();

  await categorySwitch.uncheck();
  await expect(page.locator(".category-all-off-note")).toHaveText(
    "All layers are off. To hide and bring back only your picks, use the checkbox.",
  );
  await expect(roads).not.toBeChecked();
  await expect(places).not.toBeChecked();
});

test("a group control cannot turn on a layer when none were on", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  const groupControl = page.getByRole("checkbox", { name: groupControlName });

  await expect(groupControl).toBeDisabled();
  await expect(groupControl).not.toBeChecked();
  await expect(reference.getByRole("checkbox", { checked: true })).toHaveCount(0);
});

test("a suspended group is still suspended after reloading", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  await reference.getByRole("checkbox", { name: /^Roads & Highways/ }).check();
  await page.getByRole("checkbox", { name: groupControlName }).uncheck();

  await openMap(page);
  await page.getByRole("button", { name: "Layers", exact: true }).click();

  await expect(page.getByRole("button", { name: suspendedReferenceHeading })).toBeVisible();
  await page.getByRole("checkbox", { name: groupControlName }).check();
  await page.getByRole("button", { name: /^Reference\b/ }).click();
  await expect(reference.getByRole("checkbox", { name: /^Roads & Highways/ })).toBeChecked();
});

test("preferences saved before versioning are still read", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mnmapping.layer-preferences.v1",
      JSON.stringify({
        layers: { "esri-roads-reference": { visible: true, opacity: 0.4 } },
        orderVersion: 2,
      }),
    );
  });

  const reference = await openReferenceLayers(page);

  await expect(reference.getByRole("checkbox", { name: /^Roads & Highways/ })).toBeChecked();
  const opacity = reference.getByRole("slider", { name: "Roads & Highways opacity" });
  await expect(opacity).toHaveValue("40");
});

test("a layer's opacity can be changed", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  const opacity = reference.getByRole("slider", { name: "Roads & Highways opacity" });

  await opacity.fill("40");

  await expect(opacity).toHaveValue("40");
  await expect(reference.getByText("40%", { exact: true })).toBeVisible();
});

test("a layer can be moved above its neighbor", async ({ page }) => {
  const reference = await openReferenceLayers(page);
  const names = () => reference.locator(".layer-name").allTextContents();
  const before = await names();

  await reference.getByRole("button", { name: "Move Roads & Highways above" }).click();

  const after = await names();
  const position = (list: string[], name: string) => list.indexOf(name);
  expect(position(before, "Place Labels & Boundaries")).toBeLessThan(
    position(before, "Roads & Highways"),
  );
  expect(position(after, "Roads & Highways")).toBeLessThan(
    position(after, "Place Labels & Boundaries"),
  );
});
