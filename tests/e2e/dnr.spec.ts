import { expect, test, type Locator, type Page } from "@playwright/test";
import beltrami from "@/lib/dnr/fixtures/lakefinder-beltrami.json" with { type: "json" };
import basin from "@/lib/dnr/fixtures/public-waters-basin.json" with { type: "json" };
import fishingSite from "@/lib/dnr/fixtures/fishing-site.json" with { type: "json" };
import { openMap } from "./support/map";

// The two builds differ in what they list, and CI runs this file against each.
const personal = process.env.NEXT_PUBLIC_APP_MODE === "personal";

const toolRow = (page: Page) => page.getByRole("navigation", { name: "Map tools" });
const sheetHost = (page: Page) => page.getByRole("complementary", { name: "Map sheet" });

const currentPeriod = "July 2026 - June 2027";
const lapsedPeriod = "July 2025 - June 2026";
// Inside every season the configured labels and the service's period cover.
const inSeason = new Date("2026-10-01T12:00:00Z");
const walkInSite = {
  attributes: {
    map_title: "Blue Earth WIA #1001",
    cty_name: "Blue Earth",
    acres: 48.79,
    uses: "All Compatible",
    usernotes: " ",
    wia_id: "wia0701001",
  },
};

interface ServiceOptions {
  period?: string;
  pointQueries?: URL[];
  // How the LakeFinder API answers; unset leaves it unreachable.
  lakeFinder?: { json: unknown; status?: number };
}

const noRecordAnswer = { status: "ERROR", message: "Search returned no results.", results: null };

function featuresAtPoint(url: URL): { attributes: unknown }[] {
  if (url.pathname.includes("bdry_dnr_walk_in_access_sites")) return [walkInSite];
  if (url.pathname.includes("water_mn_public_waters")) return [basin];
  if (url.pathname.includes("struc_fishing_sites_in_minnesota")) return [fishingSite];
  return [];
}

// The bathymetry service holds the lake outline under a point and the contours near it.
function bathymetryAt(url: URL): { attributes: unknown }[] {
  if (!url.pathname.endsWith("/query")) return [];
  const lake = { dowlknum: "04013500", lake_name: "Beltrami" };
  return url.pathname.endsWith("/1/query")
    ? [{ attributes: { ...lake, cty_name: "Beltrami", acres: 733.4, island: "N" } }]
    : [{ attributes: { ...lake, abs_depth: 10 } }];
}

// Answers the services the DNR layers ask: the period each seasonal service publishes, the
// feature under a clicked point, an empty viewport, and LakeFinder.
function mockDnrServices({
  period = currentPeriod,
  pointQueries = [],
  lakeFinder,
}: ServiceOptions = {}) {
  return async (page: Page) => {
    await page.route("**/api/gis-proxy/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes("/dnr-lakefinder/")) {
        return lakeFinder ? route.fulfill(lakeFinder) : route.abort();
      }
      if (url.pathname.includes("/dnr-gis-item/")) {
        return route.fulfill({ json: { title: "CWD_Sampling_and_Regulations_for_MN_2026_Deer_Seasons_Public_View_SC" } });
      }
      if (url.pathname.includes("/water_lake_bathymetry/MapServer/")) {
        return route.fulfill({ json: { features: bathymetryAt(url) } });
      }
      if (!url.pathname.includes("/FeatureServer")) return route.abort();
      if (url.pathname.endsWith("/FeatureServer")) {
        return route.fulfill({ json: { layers: [
          { id: 1, name: "wld_cwd_hunter_resource_sites_web" },
          { id: 3, name: "wld_cwd_dpa_sampling_area_web" },
        ] } });
      }
      if (url.pathname.endsWith("/FeatureServer/1")) {
        return route.fulfill({ json: {
          objectIdField: "objectid",
          maxRecordCount: 1000,
          name: "wld_cwd_hunter_resource_sites_web",
          fields: ["sitename", "nearestcity", "servicetype", "cwdareas", "dpa", "sampletime", "selfsrtime", "address", "directions", "notes", "admin", "last_edited_date", "moredetail", "show"].map((name) => ({ name })),
        } });
      }
      if (!url.pathname.endsWith("/query")) {
        return route.fulfill({ json: { objectIdField: "objectid", maxRecordCount: 1000 } });
      }
      if (url.searchParams.get("returnDistinctValues") === "true") {
        return route.fulfill({ json: { features: [{ attributes: { effperiod: period } }] } });
      }
      if (url.pathname.endsWith("/3/query")) {
        return route.fulfill({ json: { features: [{ attributes: { effperiod: period } }] } });
      }
      if (url.pathname.endsWith("/1/query")) {
        return route.fulfill({ json: { features: [{ attributes: { last_edited_date: Date.UTC(2026, 8, 20) } }] } });
      }
      if (url.searchParams.get("geometryType") === "esriGeometryPoint") {
        pointQueries.push(url);
        return route.fulfill({ json: { features: featuresAtPoint(url) } });
      }
      return route.fulfill({ json: { type: "FeatureCollection", features: [] } });
    });
  };
}

async function openDnrRecreation(page: Page, options: ServiceOptions = {}, now = inSeason) {
  await page.clock.setFixedTime(now);
  const canvas = await openMap(page, mockDnrServices(options));
  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^DNR Recreation\b/ }).click();
  return canvas;
}

// Active layers repeats every layer that is on, so rows are looked up in the DNR section only.
const layerCheckbox = (page: Page, name: RegExp) =>
  page.locator("#layer-section-dnr-recreation").getByRole("checkbox", { name });
const groupControl = (page: Page, label: string) =>
  page.getByRole("checkbox", { name: `Suspend or restore ${label} layers` });
const headingButton = (page: Page, label: string) =>
  page.getByRole("button", { name: new RegExp(`^${label}\\b`) });

test.describe("the public build", () => {
  test.skip(personal, "Only the public build leaves DNR Recreation out.");

  test("lists no DNR Recreation layers and has no route to the DNR GIS server", async ({
    page,
    request,
  }) => {
    await openMap(page);
    await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();

    await expect(page.getByRole("button", { name: /^Public lands\b/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^DNR Recreation\b/ })).toHaveCount(0);
    await page.getByRole("button", { name: /^Public lands\b/ }).click();
    await expect(page.getByRole("checkbox", { name: /^Boundary Waters Canoe Area/ })).toHaveCount(0);
    const response = await request.get("/api/gis-proxy/dnr-gis/Hosted/Anything/FeatureServer/0");
    expect(response.status()).toBe(400);
    const restrictedMapServer = await request.get(
      "/api/gis-proxy/mngeo-features/us_mn_state_dnr/env_buffer_protection_mn/MapServer/1",
    );
    expect(restrictedMapServer.status()).toBe(400);
    const lakeFinder = await request.get("/api/gis-proxy/dnr-lakefinder/by_id/v1?id=04013500");
    expect(lakeFinder.status()).toBe(400);
    const cwdItem = await request.get("/api/gis-proxy/dnr-gis-item/8462b6a81c46461484c68d4bd638134c");
    expect(cwdItem.status()).toBe(400);
    expect((await request.get("/api/lake-map/b0025010.pdf")).status()).toBe(404);
  });
});

test.describe("the personal build", () => {
  test.skip(!personal, "DNR Recreation is listed only in the personal build.");

  test("lists five headings, with every layer off", async ({ page }) => {
    await openDnrRecreation(page);

    const headings = [
      "Hunting zones & health",
      "Hunting access & habitat",
      "Fishing & water access",
      "Recreation trails",
      "Water & regulatory reference",
    ];
    for (const heading of headings) {
      await expect(headingButton(page, heading)).toBeVisible();
      await expect(groupControl(page, heading)).toBeVisible();
      await expect(page.getByRole("checkbox", { name: `All ${heading} on` })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /^DNR Recreation\b.*0 on/ })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "All DNR Recreation on" })).toHaveCount(0);
    for (const heading of headings.slice(0, 3)) await headingButton(page, heading).click();
    const section = page.locator("#layer-section-dnr-recreation");
    await expect(section.getByRole("checkbox", { checked: true })).toHaveCount(0);
    for (const layer of ["Deer permit areas", "Walk-In Access sites", "Public-water access"]) {
      await expect(layerCheckbox(page, new RegExp(`^${layer}`))).not.toBeChecked();
    }
    await headingButton(page, "Recreation trails").click();
    for (const layer of ["State forest roads", "State Trails", "Snowmobile trails", "OHV trails"]) {
      await expect(layerCheckbox(page, new RegExp(`^${layer}`))).not.toBeChecked();
    }
    await page.getByRole("button", { name: /^Public lands\b/ }).click();
    await expect(page.getByRole("checkbox", { name: /^Boundary Waters Canoe Area/ })).toBeVisible();
  });

  test("lists the wetlands and buffer layers with their non-ownership meanings", async ({ page }) => {
    await openDnrRecreation(page);
    await headingButton(page, "Water & regulatory reference").click();

    const nwi = layerCheckbox(page, /^National Wetlands Inventory/);
    const bufferLines = layerCheckbox(page, /^Buffer Protection — public waters/);
    const bufferBasins = layerCheckbox(page, /^Buffer Protection — lakes/);
    await expect(nwi).toBeVisible();
    await expect(bufferLines).toBeVisible();
    await expect(bufferBasins).toBeVisible();
    await expect(nwi).not.toBeChecked();
    await expect(page.getByText(/no legal or regulatory status/)).toBeVisible();
    await expect(page.getByText(/not parcel ownership or a compliance determination/)).toHaveCount(2);
  });

  test("stale trail freshness warns without disabling OHV or snowmobile", async ({ page }) => {
    await openDnrRecreation(page, {}, new Date("2028-01-01T12:00:00Z"));
    await headingButton(page, "Recreation trails").click();

    await expect(layerCheckbox(page, /^OHV trails/)).toBeEnabled();
    await expect(layerCheckbox(page, /^Snowmobile trails/)).toBeEnabled();
    await expect(page.getByText("Source freshness warning")).toHaveCount(2);
    await expect(page.getByText("The layer remains available.")).toHaveCount(2);
  });

  test("a heading control suspends and restores only its own active subset", async ({ page }) => {
    await openDnrRecreation(page);
    await headingButton(page, "Hunting access & habitat").click();
    await headingButton(page, "Fishing & water access").click();
    const walkIn = layerCheckbox(page, /^Walk-In Access sites/);
    const piers = layerCheckbox(page, /^Fishing piers/);
    await walkIn.check();
    await piers.check();

    await groupControl(page, "Hunting access & habitat").uncheck();

    await expect(walkIn).not.toBeChecked();
    await expect(piers).toBeChecked();
    await expect(
      page.getByRole("button", { name: /^Hunting access & habitat\b.*0 on · 1 suspended/ }),
    ).toBeVisible();

    await groupControl(page, "Hunting access & habitat").check();

    await expect(walkIn).toBeChecked();
    await expect(piers).toBeChecked();
  });

  test("the DNR Recreation control suspends every heading and restores it", async ({ page }) => {
    await openDnrRecreation(page);
    await headingButton(page, "Hunting access & habitat").click();
    await headingButton(page, "Fishing & water access").click();
    const walkIn = layerCheckbox(page, /^Walk-In Access sites/);
    const piers = layerCheckbox(page, /^Fishing piers/);
    await walkIn.check();
    await piers.check();

    await groupControl(page, "DNR Recreation").uncheck();
    await expect(walkIn).not.toBeChecked();
    await expect(piers).not.toBeChecked();

    await groupControl(page, "DNR Recreation").check();
    await expect(walkIn).toBeChecked();
    await expect(piers).toBeChecked();
  });

  test("a season that is not current leaves its row unavailable and ignores a stored on", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "mnmapping.layer-preferences",
        JSON.stringify({
          version: 2,
          layers: { "mndnr-bear-permit-areas": { visible: true, opacity: 1 } },
          suspended: {},
          order: [],
          verticalExaggeration: 1,
        }),
      );
    });
    // Bear is verified through 2027-03-31, so this date also lapses it; turkey lapsed earlier.
    await openDnrRecreation(page, { period: lapsedPeriod }, new Date("2027-04-01T12:00:00Z"));
    await headingButton(page, "Hunting zones & health").click();
    await headingButton(page, "Hunting access & habitat").click();

    for (const layer of [/^Deer permit areas/, /^Bear permit areas/, /^CWD zones/, /^CWD sampling/, /^Turkey permit/]) {
      await expect(layerCheckbox(page, layer)).toBeDisabled();
      await expect(layerCheckbox(page, layer)).not.toBeChecked();
    }
    await expect(page.getByText("Season data not verified")).toHaveCount(5);
    await expect(page.getByText("Last verified: July 2026 - June 2027").first()).toBeVisible();
    await expect(page.getByText("Last verified: 2026 season")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Check the official DNR source/ }).first(),
    ).toHaveAttribute("href", /^https:\/\/www\.dnr\.state\.mn\.us\//);
    await expect(layerCheckbox(page, /^Walk-In Access sites/)).toBeEnabled();
    await expect(page.getByRole("button", { name: /^DNR Recreation\b.*0 on/ })).toBeVisible();
  });

  test("a current season shows its label and lets the layer be switched on", async ({ page }) => {
    await openDnrRecreation(page);
    await headingButton(page, "Hunting zones & health").click();

    const deer = layerCheckbox(page, /^Deer permit areas/);
    await expect(deer).toBeEnabled();
    await expect(page.getByText(`Season: ${currentPeriod}`).first()).toBeVisible();
    await deer.check();
    await expect(deer).toBeChecked();
  });

  test("CWD sampling becomes available after all five source checks pass", async ({ page }) => {
    await openDnrRecreation(page);
    await headingButton(page, "Hunting zones & health").click();

    const sites = layerCheckbox(page, /^CWD sampling & self-service sites/);
    await expect(sites).toBeEnabled();
    await expect(page.getByText(`Season: ${currentPeriod}`).first()).toBeVisible();
    await sites.check();
    await expect(sites).toBeChecked();
  });

  test("a result shows the meaning statement, verify link, attribution, and more details", async ({
    page,
  }) => {
    const pointQueries: URL[] = [];
    const canvas = await openDnrRecreation(page, { pointQueries });
    await headingButton(page, "Hunting access & habitat").click();
    await layerCheckbox(page, /^Walk-In Access sites/).check();
    await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
    await expect(sheetHost(page)).toBeHidden();

    const results = sheetHost(page).locator(".identify-result strong");
    await expect(async () => {
      await canvas.click();
      await expect(results.first()).toBeVisible({ timeout: 1000 });
    }).toPass();
    await sheetHost(page).getByRole("button", { name: /Blue Earth WIA #1001/ }).click();

    const detail = sheetHost(page).getByRole("region", { name: "Explore" });
    await expect(detail.getByRole("heading", { name: "Blue Earth WIA #1001" })).toBeVisible();
    await expect(
      detail.getByText(/Participating private land — WIA validation required/),
    ).toBeVisible();
    await expect(detail.getByRole("link", { name: /Verify current regulations/ })).toHaveAttribute(
      "href",
      "https://www.dnr.state.mn.us/walkin/index.html",
    );
    await expect(
      detail.getByText("Minnesota DNR · reference only, not a legal boundary or proof of access"),
    ).toBeVisible();
    await expect(detail.getByText("wia0701001")).toBeHidden();
    await detail.getByText("More details").click();
    await expect(detail.getByText("wia0701001")).toBeVisible();
    expect(pointQueries.some((query) => query.pathname.includes("walk_in_access"))).toBe(true);
  });

  test("the Lake depth map row warns that coverage is incomplete and historical", async ({
    page,
  }) => {
    await openDnrRecreation(page);
    await headingButton(page, "Fishing & water access").click();

    const row = page.locator(".layer-row", { hasText: "Lake depth map" });
    await expect(row.getByText(/incomplete and historical/)).toBeVisible();
    await expect(layerCheckbox(page, /^Lake depth map/)).not.toBeChecked();
  });

  test("refuses a lake map name that is not a sheet, and never lets one be cached", async ({
    request,
  }) => {
    const response = await request.get("/api/lake-map/secret.pdf");

    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test.describe("the LakeFinder summary", () => {
    async function openSummary(
      page: Page,
      layer: RegExp,
      options: ServiceOptions,
      inspectResult?: (result: Locator) => Promise<void>,
    ) {
      const canvas = await openDnrRecreation(page, options);
      await headingButton(page, "Fishing & water access").click();
      await layerCheckbox(page, layer).check();
      await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
      await expect(sheetHost(page)).toBeHidden();
      const results = sheetHost(page).locator(".identify-result strong");
      await expect(async () => {
        await canvas.click();
        await expect(results.first()).toBeVisible({ timeout: 1000 });
      }).toPass();
      await results.first().click();
      const detail = sheetHost(page).getByRole("region", { name: "Explore" });
      await inspectResult?.(detail);
      await detail.getByRole("button", { name: "Open lake summary" }).click();
      return detail;
    }

    test("opens from the Lake depth map and shows special regulations verbatim", async ({ page }) => {
      const detail = await openSummary(
        page,
        /^Lake depth map/,
        { lakeFinder: { json: beltrami.body } },
        async (result) => {
          await expect(result.getByText("10 ft")).toBeVisible();
          await expect(result.getByText(/incomplete and historical/)).toBeVisible();
        },
      );

      await expect(detail.getByRole("heading", { name: "Beltrami" })).toBeVisible();
      await expect(detail.getByText("Maximum depth")).toBeVisible();
      await expect(detail.getByText("Daily limit five.")).toBeVisible();
      await expect(detail.getByText("must be immediately released.", { exact: false })).toBeVisible();
      await expect(detail.getByRole("link", { name: /Verify current regulations/ })).toHaveAttribute(
        "href",
        "https://www.dnr.state.mn.us/regulations/fishing/index.html",
      );
      await expect(detail.getByRole("link", { name: /Lake map \(PDF\)/ })).toHaveAttribute(
        "href",
        "/api/lake-map/b0025010.pdf",
      );
      await expect(detail.getByText("Species encountered in DNR fisheries surveys")).toBeVisible();
      await expect(detail.getByText(/fishable|bowfish/i)).toHaveCount(0);
    });

    test("opens from a fishing site while the outline layer is off", async ({ page }) => {
      const pointQueries: URL[] = [];
      const norway = {
        ...beltrami.body,
        results: [{ ...beltrami.body.results[0], id: fishingSite.attributes.dow_lake_number, name: "Norway" }],
      };
      const detail = await openSummary(page, /^Fishing piers/, {
        lakeFinder: { json: norway },
        pointQueries,
      });

      await expect(detail.getByRole("heading", { name: "Norway" })).toBeVisible();
      expect(pointQueries.some((query) => query.pathname.includes("water_mn_public_waters"))).toBe(false);
    });

    test("falls back to links, not an error, when DNR has no record", async ({ page }) => {
      const detail = await openSummary(page, /^Lake depth map/, {
        lakeFinder: { json: noRecordAnswer },
      });

      await expect(detail.getByText("DNR has no LakeFinder record for this lake.")).toBeVisible();
      await expect(detail.getByRole("link", { name: /Search LakeFinder/ })).toBeVisible();
      await expect(detail.getByRole("alert")).toHaveCount(0);
    });

    test("falls back to links when the API is down", async ({ page }) => {
      const detail = await openSummary(page, /^Lake depth map/, {
        lakeFinder: { status: 502, json: { error: "down" } },
      });

      await expect(
        detail.getByText("DNR lake data isn't responding — official links below"),
      ).toBeVisible();
      await expect(detail.getByRole("link", { name: /Full LakeFinder page/ })).toBeVisible();
    });

    test("shows the exact wording when DNR lists no special regulations", async ({ page }) => {
      const empty = {
        ...beltrami.body,
        results: [{ ...beltrami.body.results[0], specialFishingRegs: [] }],
      };
      const detail = await openSummary(page, /^Lake depth map/, { lakeFinder: { json: empty } });

      await expect(
        detail.getByText(
          "No lake-specific special regulations listed by DNR. Statewide, border-water, method, and seasonal rules may still apply.",
        ),
      ).toBeVisible();
    });
  });
});
