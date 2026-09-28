import { expect, test } from "@playwright/test";

const personalBuild = process.env.NEXT_PUBLIC_APP_MODE === "personal";

test("keeps the sync API unavailable in the public build", async ({ request }) => {
  const response = await request.get("/api/sync");
  expect(response.status()).toBe(personalBuild ? 401 : 404);
});
