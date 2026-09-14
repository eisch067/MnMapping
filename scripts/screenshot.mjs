import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000";
const output = resolve(process.argv[3] ?? "screenshots/localhost.png");
let browser;

try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
  if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status() ?? "unknown"}`);
  await page.locator("main").waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  // Give the client-rendered UI time to settle after hydration.
  await page.waitForTimeout(2000);
  await mkdir(dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true });
  console.log(`Screenshot saved: ${output}`);
} catch (error) {
  console.error(`Screenshot failed: ${error.message}`);
  console.error("Ensure Microsoft Edge is installed and the app is running (npm run dev).");
  process.exitCode = 1;
} finally {
  await browser?.close();
}
