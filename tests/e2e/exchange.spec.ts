import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";
import { openMap } from "./support/map";

const pointFeature = (name: string, coordinates: [number, number], description?: string) => ({
  type: "Feature",
  properties: { name, description },
  geometry: { type: "Point", coordinates },
});

const geojsonFile = (name: string, ...features: unknown[]) => ({
  name,
  mimeType: "application/geo+json",
  buffer: Buffer.from(JSON.stringify({ type: "FeatureCollection", features })),
});

const kmlFile = {
  name: "stands.kml",
  mimeType: "application/vnd.google-earth.kml+xml",
  buffer: Buffer.from(`<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>
    <Folder><name>Stands</name>
      <Placemark><name>Oak stand</name><Point><coordinates>-95.06,46.92</coordinates></Point></Placemark>
      <Placemark><name>Trail</name><LineString><coordinates>-95.06,46.92 -95.05,46.93</coordinates></LineString></Placemark>
    </Folder>
    <GroundOverlay><name>Old map</name></GroundOverlay></Document></kml>`),
};

function sheetOf(page: Page) {
  return page.getByRole("complementary", { name: "Map sheet" });
}

async function openMyData(page: Page) {
  await page
    .getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "My Data", exact: true })
    .click();
  return sheetOf(page);
}

async function importFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const sheet = await openMyData(page);
  await sheet.getByLabel("Import GPX, KML, or GeoJSON").setInputFiles(file);
  // The result sheet opens when the import finishes; acting before then would be overridden.
  await expect(sheet.getByRole("region", { name: "Import result" })).toBeVisible();
  return sheet;
}

async function downloadText(download: Download): Promise<string> {
  return readFile(await download.path(), "utf8");
}

test("an imported KML file becomes an Import folder that can be undone", async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page);
  const sheet = await importFile(page, kmlFile);

  await expect(sheet.getByText(/^Imported into stands\.kml /)).toBeVisible();
  await expect(sheet.getByText("1 pin, 1 line, 0 areas")).toBeVisible();
  await expect(sheet.getByText("1 unsupported item skipped", { exact: false })).toBeVisible();
  await expect(sheet.getByText("1 source folder flattened", { exact: false })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await sheet.getByRole("button", { name: "Undo import" }).click();
  await expect(sheet.getByText(/Moved to Trash/)).toBeVisible();

  await openMyData(page);
  await sheet.getByRole("button", { name: "Trash", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Restore folder" })).toBeVisible();
});

test("an unsupported or malformed file imports nothing and says why", async ({ page }) => {
  await openMap(page);
  const kmz = {
    name: "trip.kmz",
    mimeType: "application/vnd.google-earth.kmz",
    buffer: Buffer.from("PK"),
  };
  const sheet = await importFile(page, kmz);
  await expect(sheet.getByRole("alert")).toContainText("Export the file as KML instead");

  await openMyData(page);
  await sheet
    .getByLabel("Import GPX, KML, or GeoJSON")
    .setInputFiles({
      name: "broken.geojson",
      mimeType: "application/json",
      buffer: Buffer.from("{nope"),
    });
  await expect(sheet.getByRole("alert")).toContainText("not valid JSON");

  await openMyData(page);
  await expect(sheet.getByRole("button", { name: /^trip\.kmz|^broken\.geojson/ })).toHaveCount(0);
});

test("a folder exports as KML and as GPX with the area notice", async ({ page }) => {
  test.setTimeout(60_000);
  await openMap(page);
  const area = {
    type: "Feature",
    properties: { name: "Field" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-95, 47],
          [-94.9, 47],
          [-94.9, 47.1],
          [-95, 47],
        ],
      ],
    },
  };
  await importFile(
    page,
    geojsonFile("field.geojson", pointFeature("Camp", [-95, 47], "Flat"), area),
  );
  const sheet = await openMyData(page);
  await sheet.getByRole("button", { name: /^field\.geojson / }).click();
  await sheet.getByRole("button", { name: "Export this list…" }).click();

  await expect(sheet.getByText(/^field\.geojson .* \(2 items\)$/)).toBeVisible();
  await expect(sheet.getByRole("listitem")).toHaveCount(1);
  const kmlDownload = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "Download", exact: true }).click();
  const kml = await kmlDownload;
  expect(kml.suggestedFilename()).toMatch(/^field\.geojson-.*_\d{4}-\d{2}-\d{2}_\d{4}\.kml$/);
  const kmlText = await downloadText(kml);
  expect(kmlText).toContain("<Placemark><name>Camp</name><description>Flat</description>");
  expect(kmlText).toContain("<Polygon>");

  await sheet.getByRole("button", { name: "OnX Mobile (GPX)" }).click();
  await expect(sheet.getByRole("note")).toContainText("1 area is exported as a closed track");
  const gpxDownload = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "Download", exact: true }).click();
  const gpx = await gpxDownload;
  expect(gpx.suggestedFilename()).toMatch(/\.gpx$/);
  const gpxText = await downloadText(gpx);
  expect(gpxText).toContain("<wpt");
  expect(gpxText).toContain("<trk>");
});

test("select mode exports only the chosen items", async ({ page }) => {
  await openMap(page);
  await importFile(
    page,
    geojsonFile(
      "pins.geojson",
      pointFeature("Stand", [-95, 47]),
      pointFeature("Blind", [-95.1, 47.1]),
    ),
  );
  const sheet = await openMyData(page);
  await sheet.getByRole("button", { name: /^pins\.geojson / }).click();

  await sheet.getByRole("button", { name: "Select", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Export selected…" })).toBeDisabled();
  await sheet.getByLabel("Select Blind").check();
  await expect(sheet.getByText("1 selected")).toBeVisible();
  await sheet.getByRole("button", { name: "Export selected…" }).click();

  await expect(
    sheet.getByRole("region", { name: "Export" }).getByText("Blind", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "Download", exact: true }).click();
  const text = await downloadText(await download);
  expect(text).toContain("<name>Blind</name>");
  expect(text).not.toContain("Stand");
});

test("an archive restores what delete-all removed", async ({ page }) => {
  test.setTimeout(90_000);
  await openMap(page);
  await importFile(page, geojsonFile("keep.geojson", pointFeature("Keeper", [-95, 47])));
  const sheet = await openMyData(page);
  await sheet.getByRole("button", { name: "Backup and restore" }).click();

  const archiveDownload = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "Download archive" }).click();
  const archive = await downloadText(await archiveDownload);
  expect(JSON.parse(archive)).toMatchObject({ format: "mnmapping-archive", schemaVersion: 2 });

  await sheet.getByRole("button", { name: "Delete all my data…" }).click();
  const confirm = sheet.getByRole("button", { name: "Delete everything" });
  await expect(confirm).toBeDisabled();
  await sheet.getByLabel("I understand this cannot be undone.").check();
  await confirm.click();

  await openMyData(page);
  await expect(sheet.getByRole("button", { name: /^keep\.geojson / })).toHaveCount(0);

  await sheet.getByRole("button", { name: "Backup and restore" }).click();
  await sheet.getByLabel("Restore from archive").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(archive),
  });
  await expect(sheet.getByRole("list", { name: "Restore result" })).toContainText(
    "1 item restored.",
  );

  await openMyData(page);
  await sheet.getByRole("button", { name: /^keep\.geojson / }).click();
  await expect(sheet.getByText("Keeper", { exact: true })).toBeVisible();

  await sheet.getByRole("button", { name: "Backup and restore" }).click();
  await sheet.getByLabel("Restore from archive").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(archive),
  });
  await expect(sheet.getByRole("list", { name: "Restore result" })).toContainText(
    "1 item was already here and was left unchanged.",
  );
});
