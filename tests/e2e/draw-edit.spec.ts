import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { openMap } from "./support/map";

test.describe.configure({ mode: "serial" });

async function openAdd(page: Page) {
  await page.getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  return page.getByRole("complementary", { name: "Map sheet" });
}

async function placeVertex(
  canvas: Locator,
  xRatio: number,
  yRatio: number,
  testInfo: TestInfo,
  vertexCount: Locator,
  expectedCount: number,
) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Map canvas is not visible.");
  const position = { x: box.width * xRatio, y: box.height * yRatio };
  const expectedText = `${expectedCount} ${expectedCount === 1 ? "vertex" : "vertices"}`;
  await expect(async () => {
    if (await vertexCount.textContent() === expectedText) return;
    if (testInfo.project.name === "mobile") await canvas.tap({ position });
    else await canvas.click({ position });
    await expect(vertexCount).toHaveText(expectedText, { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

test("draws three labeled vertices and undoes the last vertex", async ({ page }, testInfo) => {
  const canvas = await openMap(page);
  const sheet = await openAdd(page);
  await sheet.getByRole("button", { name: "Line", exact: true }).click();
  const vertexCount = sheet.locator(".shape-action-panel strong");

  await placeVertex(canvas, 0.58, 0.45, testInfo, vertexCount, 1);
  await placeVertex(canvas, 0.68, 0.52, testInfo, vertexCount, 2);
  await placeVertex(canvas, 0.76, 0.43, testInfo, vertexCount, 3);
  await expect(sheet.getByText("3 vertices", { exact: true })).toBeVisible();
  await expect(sheet.getByText(/mi$/)).toBeVisible();

  await sheet.getByRole("button", { name: "Undo" }).click();
  await expect(sheet.getByText("2 vertices", { exact: true })).toBeVisible();
});

test("cancel leaves no drawing behind", async ({ page }, testInfo) => {
  const canvas = await openMap(page);
  const sheet = await openAdd(page);
  await sheet.getByRole("button", { name: "Area", exact: true }).click();
  const vertexCount = sheet.locator(".shape-action-panel strong");
  await placeVertex(canvas, 0.58, 0.45, testInfo, vertexCount, 1);
  await placeVertex(canvas, 0.7, 0.45, testInfo, vertexCount, 2);
  await placeVertex(canvas, 0.64, 0.55, testInfo, vertexCount, 3);

  await sheet.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "My Data", exact: true })
    .click();
  await expect(page.getByText("No items in this view.")).toBeVisible();
});

test("inserts a midpoint and persists the saved shape after reload", async ({ page }, testInfo) => {
  const canvas = await openMap(page);
  let sheet = await openAdd(page);
  await sheet.getByRole("button", { name: "Line", exact: true }).click();
  let vertexCount = sheet.locator(".shape-action-panel strong");
  await placeVertex(canvas, 0.58, 0.45, testInfo, vertexCount, 1);
  await placeVertex(canvas, 0.74, 0.55, testInfo, vertexCount, 2);
  page.once("dialog", (dialog) => dialog.accept("Saved route"));
  await sheet.getByRole("button", { name: "Finish" }).click();

  await openMap(page);
  await page.getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "My Data", exact: true })
    .click();
  sheet = page.getByRole("complementary", { name: "Map sheet" });
  await expect(sheet.getByText("Saved route", { exact: true })).toBeVisible();
  await sheet.getByRole("button", { name: "Edit shape" }).click();
  await expect(sheet.getByText("2 vertices", { exact: true })).toBeVisible();

  vertexCount = sheet.locator(".shape-action-panel strong");
  await placeVertex(canvas, 0.66, 0.5, testInfo, vertexCount, 3);
  await expect(sheet.getByText("3 vertices", { exact: true })).toBeVisible();
  await sheet.getByRole("button", { name: "Save shape" }).click();

  await openMap(page);
  await page.getByRole("navigation", { name: "Map tools" })
    .getByRole("button", { name: "My Data", exact: true })
    .click();
  sheet = page.getByRole("complementary", { name: "Map sheet" });
  await sheet.getByRole("button", { name: "Edit shape" }).click();
  await expect(sheet.getByText("3 vertices", { exact: true })).toBeVisible();
});
