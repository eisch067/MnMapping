import { expect, test, type Page } from "@playwright/test";
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
}

// Answers the services the DNR layers ask: the period each seasonal service publishes, the
// feature under a clicked point, and an empty viewport.
function mockDnrServices({ period = currentPeriod, pointQueries = [] }: ServiceOptions = {}) {
  return async (page: Page) => {
    await page.route("**/api/gis-proxy/**", (route) => {
      const url = new URL(route.request().url());
      if (!url.pathname.includes("/FeatureServer")) return route.abort();
      if (!url.pathname.endsWith("/query")) {
        return route.fulfill({ json: { objectIdField: "objectid", maxRecordCount: 1000 } });
      }
      if (url.searchParams.get("returnDistinctValues") === "true") {
        return route.fulfill({ json: { features: [{ attributes: { effperiod: period } }] } });
      }
      if (url.searchParams.get("geometryType") === "esriGeometryPoint") {
        pointQueries.push(url);
        const isWalkIn = url.pathname.includes("bdry_dnr_walk_in_access_sites");
        return route.fulfill({ json: { features: isWalkIn ? [walkInSite] : [] } });
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
    const response = await request.get("/api/gis-proxy/dnr-gis/Hosted/Anything/FeatureServer/0");
    expect(response.status()).toBe(400);
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
    }
    await expect(page.getByRole("button", { name: /^DNR Recreation\b.*0 on/ })).toBeVisible();
    for (const heading of headings.slice(0, 3)) await headingButton(page, heading).click();
    const section = page.locator("#layer-section-dnr-recreation");
    await expect(section.getByRole("checkbox", { checked: true })).toHaveCount(0);
    for (const layer of ["Deer permit areas", "Walk-In Access sites", "Public-water access"]) {
      await expect(layerCheckbox(page, new RegExp(`^${layer}`))).not.toBeChecked();
    }
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

    for (const layer of [/^Deer permit areas/, /^Bear permit areas/, /^CWD zones/, /^Turkey permit/]) {
      await expect(layerCheckbox(page, layer)).toBeDisabled();
      await expect(layerCheckbox(page, layer)).not.toBeChecked();
    }
    await expect(page.getByText("Season data not verified")).toHaveCount(4);
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
});
