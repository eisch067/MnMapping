import { expect, test } from "@playwright/test";
import { openMap } from "./support/map";

test("creates a folder, moves an item, trashes the bundle, and restores it", async ({ page }) => {
  await openMap(page);
  await page.getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "My Data", exact: true })
    .click();
  const sheet = page.getByRole("complementary", { name: "Map sheet" });

  await sheet.getByLabel("Import GPX, KML, or GeoJSON").setInputFiles({
    name: "field-note.geojson",
    mimeType: "application/geo+json",
    buffer: Buffer.from(JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: { name: "Imported pin" },
        geometry: { type: "Point", coordinates: [-95, 47] },
      }],
    })),
  });
  await expect(sheet.getByText("Imported pin", { exact: true })).toBeVisible();

  await sheet.getByLabel("New folder name").fill("Field Work");
  await sheet.getByRole("button", { name: "Create folder" }).click();
  await sheet.getByLabel("Folder for Imported pin").selectOption({ label: "Field Work" });
  await sheet.getByRole("button", { name: "Field Work", exact: true }).click();
  await expect(sheet.getByText("Imported pin", { exact: true })).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("its 1 item");
    await dialog.accept();
  });
  await sheet.getByRole("button", { name: "Move folder to Trash" }).click();
  await expect(sheet.getByRole("button", { name: "Restore folder" })).toBeVisible();
  await sheet.getByRole("button", { name: "Restore folder" }).click();

  await sheet.getByRole("button", { name: "Field Work", exact: true }).click();
  await expect(sheet.getByText("Imported pin", { exact: true })).toBeVisible();
});
