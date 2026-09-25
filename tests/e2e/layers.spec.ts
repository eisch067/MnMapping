import { expect, test, type Page } from "@playwright/test";
import { openMap } from "./support/map";

async function openReferenceLayers(page: Page) {
  await openMap(page);
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: /^Reference\b/ }).click();
  return page.locator("#layer-section-reference");
}

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
