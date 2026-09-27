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

  it("defers direct and ground distance until S12", () => {
    expect(primaryDimensionLabel([[0, 0], [1, 0]], { kind: "direct", unit: "miles" })).toBeNull();
  });
});
