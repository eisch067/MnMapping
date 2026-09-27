import { describe, expect, it } from "vitest";
import { calculateViewshed, validateViewshedRequest, VIEWSHED_CELL_BUDGET, type ViewshedRequest } from "./viewshed";

function terrain(elevations: number[], overrides: Partial<ViewshedRequest> = {}): ViewshedRequest {
  return { width: 5, height: 5, elevations, cellSizeMeters: 10, observerX: 2, observerY: 2, observerHeightMeters: 0, targetHeightMeters: 0, rangeMeters: 100, ...overrides };
}

describe("calculateViewshed", () => {
  it("sees every cell on flat terrain", () => {
    expect([...calculateViewshed(terrain(Array(25).fill(100)))].every(Boolean)).toBe(true);
  });

  it("blocks cells behind a ridge", () => {
    const elevations = Array(25).fill(0);
    for (let y = 0; y < 5; y += 1) elevations[y * 5 + 3] = 100;
    const result = calculateViewshed(terrain(elevations));
    expect(result[2 * 5 + 3]).toBe(1);
    expect(result[2 * 5 + 4]).toBe(0);
  });

  it("accounts for observer height and maximum range", () => {
    const elevations = Array(25).fill(0);
    for (let y = 0; y < 5; y += 1) elevations[y * 5 + 3] = 100;
    const lowObserver = calculateViewshed(terrain(elevations));
    const highObserver = calculateViewshed(terrain(elevations, { observerHeightMeters: 300 }));
    const shortRange = calculateViewshed(terrain(Array(25).fill(0), { rangeMeters: 10 }));
    expect(lowObserver[2 * 5 + 4]).toBe(0);
    expect(highObserver[2 * 5 + 4]).toBe(1);
    expect([...shortRange].filter(Boolean)).toHaveLength(5);
    expect(validateViewshedRequest(terrain(Array(25).fill(0), { width: VIEWSHED_CELL_BUDGET + 1, height: 1 }))).toContain("device limit");
  });
});
