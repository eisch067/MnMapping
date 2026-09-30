import { describe, expect, it } from "vitest";
import { parcelZoomBand, parcelZoomThresholds, statewideParcelQuery } from "@/lib/map/parcelLoading";

describe("parcelZoomBand", () => {
  it.each([
    [0, "detailed"],
    [4_999, "detailed"],
    [5_000, "medium"],
    [14_999, "medium"],
    [15_000, "wide"],
    [35_000, "wide"],
    [35_001, "hidden"],
  ] as const)("assigns %i metres to the %s band", (height, expected) => {
    expect(parcelZoomBand(height)).toBe(expected);
  });

  it("keeps zoom thresholds named tuning constants", () => {
    expect(parcelZoomThresholds).toEqual({
      detailedBelowMeters: 5_000,
      mediumBelowMeters: 15_000,
      maximumMeters: 35_000,
    });
  });
});

describe("statewideParcelQuery", () => {
  const bounds = { west: -96, south: 45, east: -94, north: 47 };

  it("uses all parcels below 5 km and widens each side by half a viewport", () => {
    expect(statewideParcelQuery("co_code='27005'", 4_999, "acres_poly", bounds, 1_000)).toMatchObject({
      where: "co_code='27005'",
      bounds: { west: -97, south: 44, east: -93, north: 48 },
      maxAllowableOffset: undefined,
    });
  });

  it("filters to 10 acres and requests simplified geometry in the 5–15 km band", () => {
    const query = statewideParcelQuery("co_code='27005'", 10_000, "acres_poly", bounds, 1_000);
    expect(query.where).toBe("(co_code='27005') AND acres_poly >= 10");
    expect(query.maxAllowableOffset).toBe(0.002);
  });

  it("filters to 40 acres and simplifies geometry in the 15–35 km band", () => {
    const query = statewideParcelQuery("co_code='27005'", 20_000, "acres_poly", bounds, 1_000);
    expect(query.where).toBe("(co_code='27005') AND acres_poly >= 40");
    expect(query.maxAllowableOffset).toBe(0.002);
  });
});
