import { expect, test } from "@playwright/test";

const location = {
  id: "46.922100,-95.061600",
  label: "Park Rapids, Minnesota",
  latitude: 46.9221,
  longitude: -95.0616,
  county: "Hubbard",
  kind: "city",
};

test("location history hydrates without errors and remains interactive", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|server rendered html/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/hydration|server rendered html/i.test(error.message)) hydrationErrors.push(error.message);
  });
  await page.addInitScript(({ recentKey, savedKey, serializedLocation }) => {
    localStorage.setItem(recentKey, JSON.stringify([JSON.parse(serializedLocation)]));
    localStorage.setItem(savedKey, JSON.stringify([JSON.parse(serializedLocation)]));
  }, {
    recentKey: "mnmapping.recent-locations.v1",
    savedKey: "mnmapping.saved-locations.v1",
    serializedLocation: JSON.stringify(location),
  });

  await page.goto("/");

  const groups = page.locator(".location-quickjump-group");
  const saved = groups.nth(0);
  const recent = groups.nth(1);
  await expect(saved.getByText(location.label)).toBeVisible();
  await expect(recent.getByText(location.label)).toBeVisible();
  expect(hydrationErrors).toEqual([]);

  await recent.getByRole("button", { name: `Remove ${location.label} from saved locations` }).click();
  await expect(groups).toHaveCount(1);
  await groups.nth(0).getByRole("button", { name: `Save ${location.label}` }).click();
  await expect(groups).toHaveCount(2);

  await groups.nth(1).getByRole("button", { name: "Clear" }).click();
  await expect(groups).toHaveCount(1);
  await expect(groups.nth(0).getByText(location.label)).toBeVisible();

  await groups.nth(0).getByRole("button", { name: `Remove ${location.label} from saved locations` }).click();
  await expect(groups).toHaveCount(0);
});
