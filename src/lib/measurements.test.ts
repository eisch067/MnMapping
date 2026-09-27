import { describe, expect, it } from "vitest";
import { formatArea, formatDistance, primaryDimensionLabel } from "./measurements";

describe("measurement formatting", () => {
  it("formats supported distance and area units", () => {
    expect(formatDistance(1609.344, "miles")).toBe("1 mi");
    expect(formatArea(4046.8564224, "acres")).toBe("1 ac");
  });

  it("reports both polygon dimensions when selected", () => {
    const label = primaryDimensionLabel([[0, 0], [1, 0], [1, 1], [0, 1]], {
      kind: "both",
      areaUnit: "square-miles",
      perimeterUnit: "miles",
    });

    expect(label).toContain("mi² ·");
    expect(label).toMatch(/mi$/);
  });

  it("measures horizontal, direct, and ground distances from supplied DEM samples", () => {
    const line = [[0, 0], [0.01, 0]] as const;
    const horizontal = primaryDimensionLabel(line, { kind: "horizontal", unit: "meters" });
    const direct = primaryDimensionLabel(line, { kind: "direct", unit: "meters" }, [
      { position: line[0], elevationMeters: 0 },
      { position: line[1], elevationMeters: 100 },
    ]);
    const ground = primaryDimensionLabel(line, { kind: "ground", unit: "meters" }, [
      { position: line[0], elevationMeters: 0 },
      { position: [0.005, 0], elevationMeters: 0 },
      { position: line[1], elevationMeters: 100 },
    ]);

    expect(horizontal).toBe("1,113 m");
    expect(direct).toBe("1,118 m");
    expect(ground).toBe("1,122 m");
  });
});
