import type { Locator, Page } from "@playwright/test";

// Playwright's touchscreen only taps, so a swipe is sent as raw touch events over the
// DevTools protocol.
export async function swipe(page: Page, target: Locator, direction: "left" | "right") {
  // A trial tap waits for the element to stop moving, so a sheet still sliding in is not missed.
  await target.tap({ trial: true });
  const box = await target.boundingBox();
  if (!box) throw new Error("Cannot swipe an element that is not visible.");
  const y = box.y + box.height / 2;
  const start = box.x + box.width * (direction === "left" ? 0.8 : 0.2);
  const end = box.x + box.width * (direction === "left" ? 0.2 : 0.8);
  const steps = 6;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start, y }],
  });
  for (let step = 1; step <= steps; step += 1) {
    const x = start + ((end - start) * step) / steps;
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
