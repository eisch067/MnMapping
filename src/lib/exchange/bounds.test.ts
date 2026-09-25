import { describe, expect, it } from "vitest";
import { boundsOf } from "./bounds";

describe("boundsOf", () => {
  it("returns null when there is nothing to frame", () => {
    expect(boundsOf([])).toBeNull();
  });

  it("frames a single pin in a neighborhood-sized box around it", () => {
    const box = boundsOf([{ type: "Point", coordinates: [-95, 47] }]);
    expect(box).toEqual({ west: -95.005, south: 46.995, east: -94.995, north: 47.005 });
  });

  it("covers every vertex of lines and area outer rings with padding", () => {
    const box = boundsOf([
      {
        type: "LineString",
        coordinates: [
          [-96, 46],
          [-94, 48],
        ],
      },
      {
        type: "Polygon",
        coordinates: [
          [
            [-95, 47],
            [-93, 47],
            [-93, 49],
            [-95, 47],
          ],
        ],
      },
    ]);
    expect(box?.west).toBeLessThanOrEqual(-96);
    expect(box?.east).toBeGreaterThanOrEqual(-93);
    expect(box?.south).toBeLessThanOrEqual(46);
    expect(box?.north).toBeGreaterThanOrEqual(49);
  });

  it("stays inside the world", () => {
    const box = boundsOf([{ type: "Point", coordinates: [180, 90] }]);
    expect(box).toMatchObject({ east: 180, north: 90 });
  });
});
