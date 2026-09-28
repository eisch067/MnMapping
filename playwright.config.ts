import { defineConfig } from "@playwright/test";

const port = 8787;

// Runs against the built app served by wrangler, so `npm run build:vinext` must run first.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Cesium renders in software on CI and busy machines, so a desktop-size map can take many
  // seconds to start and every step after it runs slowly. Two specs at a time failed on the 30 s
  // default, so the allowance is set here rather than in each spec.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: "node scripts/start-sync-test-worker.mjs",
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
