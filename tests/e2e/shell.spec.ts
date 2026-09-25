import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mapCanvas, openMap } from "./support/map";
import { swipe } from "./support/touch";

const toolRow = (page: Page) => page.getByRole("navigation", { name: "Map tools" });
const sheetHost = (page: Page) => page.getByRole("complementary", { name: "Map sheet" });
const tab = (page: Page, name: string) => sheetHost(page).getByRole("tab", { name });
const terrainViewButton = (page: Page) =>
  sheetHost(page).getByRole("button", { name: "Terrain view" });
const isDesktop = (testInfo: TestInfo) => testInfo.project.name === "desktop";

const sheets: { action: string; shows: (page: Page) => Locator }[] = [
  {
    action: "Explore",
    shows: (page) => sheetHost(page).getByText("Click or tap the map to see coordinates."),
  },
  { action: "Layers", shows: (page) => tab(page, "Layers") },
  {
    action: "Add",
    shows: (page) => sheetHost(page).getByRole("button", { name: "Pin", exact: true }),
  },
  { action: "My Data", shows: (page) => sheetHost(page).getByText("Import GPX, KML, or GeoJSON") },
  { action: "Map", shows: terrainViewButton },
];

for (const { action, shows } of sheets) {
  test(`the ${action} action opens its sheet and toggles it closed`, async ({ page }) => {
    await openMap(page);
    const button = toolRow(page).getByRole("button", { name: action, exact: true });

    await button.click();
    await expect(shows(page)).toBeVisible();
    await expect(button).toHaveAttribute("aria-pressed", "true");

    await button.click();
    await expect(sheetHost(page)).toBeHidden();
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });
}

test("opening another action replaces the open sheet", async ({ page }) => {
  await openMap(page);

  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
  await toolRow(page).getByRole("button", { name: "Map", exact: true }).click();

  await expect(terrainViewButton(page)).toBeVisible();
  await expect(tab(page, "Layers")).toBeHidden();
});

test("the Escape key closes the open sheet", async ({ page }) => {
  await openMap(page);
  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();
  await expect(tab(page, "Layers")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(sheetHost(page)).toBeHidden();
});

test("a drawing tool stays armed only while the Add sheet is open", async ({ page }) => {
  await openMap(page);
  const add = toolRow(page).getByRole("button", { name: "Add", exact: true });
  const line = sheetHost(page).getByRole("button", { name: "Line", exact: true });

  await add.click();
  await line.click();
  await expect(line).toHaveAttribute("aria-pressed", "true");

  await add.click();
  await add.click();
  await expect(line).toHaveAttribute("aria-pressed", "false");
});

test("clicking the map with no sheet open shows the point in the Explore sheet", async ({
  page,
}) => {
  const canvas = await openMap(page);
  const point = sheetHost(page).getByText(/^46\.9\d+, -95\.0\d+$/);

  // The map starts up after the page hydrates, so keep clicking until it responds.
  await expect(async () => {
    await canvas.click();
    await expect(point).toBeVisible({ timeout: 1000 });
  }).toPass();

  await expect(toolRow(page).getByRole("button", { name: "Explore", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the Layers and My Data tabs switch between the two sheets", async ({ page }) => {
  await openMap(page);
  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).click();

  await tab(page, "My Data").click();
  await expect(tab(page, "My Data")).toHaveAttribute("aria-selected", "true");
  await expect(sheetHost(page).getByText("Import GPX, KML, or GeoJSON")).toBeVisible();

  await tab(page, "Layers").click();
  await expect(tab(page, "Layers")).toHaveAttribute("aria-selected", "true");
  await expect(sheetHost(page).getByText("Import GPX, KML, or GeoJSON")).toBeHidden();
});

test("swiping the sheet switches between Layers and My Data", async ({ page }, testInfo) => {
  test.skip(isDesktop(testInfo), "Swiping is a touch gesture.");
  await openMap(page);
  await toolRow(page).getByRole("button", { name: "Layers", exact: true }).tap();
  const tabs = sheetHost(page).getByRole("tablist");

  await swipe(page, tabs, "left");
  await expect(tab(page, "My Data")).toHaveAttribute("aria-selected", "true");

  await swipe(page, tabs, "right");
  await expect(tab(page, "Layers")).toHaveAttribute("aria-selected", "true");
});

test("with the sheet closed the map fills the viewport apart from the header and tool row", async ({
  page,
}, testInfo) => {
  const canvas = await openMap(page);
  const viewport = page.viewportSize();
  const header = await page.getByRole("banner").boundingBox();
  const tools = await toolRow(page).boundingBox();
  const box = await canvas.boundingBox();
  if (!viewport || !header || !tools || !box) throw new Error("The shell did not render.");

  const toolsAreOnLeft = isDesktop(testInfo);
  const uncovered = {
    left: toolsAreOnLeft ? tools.x + tools.width : 0,
    top: header.y + header.height,
    right: viewport.width,
    bottom: toolsAreOnLeft ? viewport.height : tools.y,
  };

  await expect(sheetHost(page)).toBeHidden();
  expect(box.x).toBeLessThanOrEqual(uncovered.left);
  expect(box.y).toBeLessThanOrEqual(uncovered.top);
  expect(box.x + box.width).toBeGreaterThanOrEqual(uncovered.right);
  expect(box.y + box.height).toBeGreaterThanOrEqual(uncovered.bottom);
});

test.describe("desktop rail", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isDesktop(testInfo), "The rail only exists at desktop widths.");
  });

  test("hovering the rail previews the sheet and leaving hides it", async ({ page }) => {
    await openMap(page);

    await toolRow(page).hover();
    await expect(tab(page, "Layers")).toBeVisible();

    await page.mouse.move(700, 400);
    await expect(sheetHost(page)).toBeHidden();
  });

  test("using a previewed sheet keeps it open", async ({ page }) => {
    await openMap(page);
    const layers = toolRow(page).getByRole("button", { name: "Layers", exact: true });

    await toolRow(page).hover();
    await expect(layers).toHaveAttribute("aria-pressed", "false");
    await sheetHost(page).getByText("Choose what appears on the map").click();

    await expect(layers).toHaveAttribute("aria-pressed", "true");
  });

  test("pinning the rail docks the sheet and resizes the map", async ({ page }) => {
    const canvas = await openMap(page);
    const unpinned = await canvas.boundingBox();
    const pin = toolRow(page).getByRole("button", { name: "Dock panel" });

    await pin.click();

    await expect(pin).toHaveAttribute("aria-pressed", "true");
    const sheet = await sheetHost(page).boundingBox();
    const docked = await canvas.boundingBox();
    if (!unpinned || !sheet || !docked) throw new Error("The shell did not render.");
    expect(docked.width).toBeLessThan(unpinned.width);
    expect(docked.x).toBeGreaterThanOrEqual(sheet.x + sheet.width);

    await pin.click();
    await expect(pin).toHaveAttribute("aria-pressed", "false");
    expect((await mapCanvas(page).boundingBox())?.width).toBe(unpinned.width);
  });
});
