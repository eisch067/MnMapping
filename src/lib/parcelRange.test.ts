import { describe, expect, it } from "vitest";
import type { CountyDefinition } from "@/config/layers/types";
import { countiesInParcelRange } from "@/lib/parcelRange";

const counties = [
  { name: "near", bounds: { west: -93.01, east: -92.99, south: 45.99, north: 46.01 } },
  { name: "edge", bounds: { west: -93.75, east: -93.65, south: 46, north: 46.1 } },
  { name: "far", bounds: { west: -94.5, east: -94.4, south: 46, north: 46.1 } },
] satisfies Pick<CountyDefinition, "name" | "bounds">[];

describe("countiesInParcelRange", () => {
  it("includes counties whose bounds partly enter 50 miles", () => {
    expect(countiesInParcelRange({ latitude: 46, longitude: -93 }, counties)).toEqual(["near", "edge"]);
  });
});
