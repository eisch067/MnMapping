import { expect, test } from "@playwright/test";

test("landing page asks where to explore", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Where would you like to explore?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Enter a Minnesota location")).toBeVisible();
});
