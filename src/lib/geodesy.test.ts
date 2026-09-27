import { describe, expect, it } from "vitest";
import {
  geodesicDistanceMeters,
  geodesicLengthMeters,
  geodesicPolygonMeasurements,
} from "./geodesy";

describe("WGS84 geodesic measurements", () => {
  it("matches the GeographicLib Wellington-to-Salamanca distance", () => {
    const distance = geodesicDistanceMeters([174.81, -41.32], [-5.5, 40.96]);

    expect(distance).toBeCloseTo(19_959_679.267, 3);
  });

  it("sums segment distances for a line", () => {
    const length = geodesicLengthMeters([[0, 0], [1, 0], [1, 1]]);

    expect(length).toBeCloseTo(221_893.879, 3);
  });

  it("matches GeographicLib's published polar polygon golden values", () => {
    const measurements = geodesicPolygonMeasurements([
      [0, 89],
      [90, 89],
      [180, 89],
      [270, 89],
    ]);

    expect(measurements.perimeterMeters).toBeCloseTo(631_819.8745, 4);
    expect(measurements.areaSquareMeters).toBeCloseTo(24_952_305_678, 0);
  });

  it("does not double-count an explicitly closed ring", () => {
    const open = [[0, 0], [1, 0], [1, 1], [0, 1]] as const;
    const closed = [...open, open[0]];

    expect(geodesicPolygonMeasurements(closed)).toEqual(geodesicPolygonMeasurements(open));
  });
});
