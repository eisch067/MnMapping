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

const groupControlName = "Suspend or restore Reference layers";
const suspendedReferenceHeading = /^Reference\b.*0 on · 1 suspended/;

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
