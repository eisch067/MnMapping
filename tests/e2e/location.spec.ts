import { expect, test } from "@playwright/test";
import { openMap } from "./support/map";

test("searching for a place opens the map centered on it", async ({ page }) => {
  const canvas = await openMap(page);

  await expect(canvas).toHaveAccessibleName("Interactive map centered on Park Rapids, Minnesota");
  await expect(
    page.getByRole("heading", { name: "Where would you like to explore?" }),
  ).toBeHidden();
});

test("changing the area returns to the search", async ({ page }) => {
  await openMap(page);

  await page.getByRole("button", { name: "Change area" }).click();

  await expect(
    page.getByRole("heading", { name: "Where would you like to explore?" }),
  ).toBeVisible();
});
