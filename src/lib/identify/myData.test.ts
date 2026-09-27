import { describe, expect, it } from "vitest";
import { identifyMyData, type IdentifiableItem } from "@/lib/identify/myData";
import type { IdentifyPoint, IdentifyResult } from "@/lib/identify/types";

const point = (longitude: number, latitude: number, toleranceMeters = 10): IdentifyPoint => ({
  longitude,
  latitude,
  toleranceMeters,
});

const titles = (results: readonly IdentifyResult[]) => results.map((result) => result.title);

function item(overrides: Partial<IdentifiableItem> & Pick<IdentifiableItem, "geometry">): IdentifiableItem {
  return { id: "item", name: "Item", createdAt: "2026-09-01T12:00:00.000Z", ...overrides };
}

// One degree of latitude is about 111 km, so 0.0001 degrees is about 11 meters.
const camp = item({
  id: "camp",
  name: "North camp",
  note: "Flat spot by the creek",
  geometry: { type: "Point", coordinates: [-95.1, 47.0] },
});
const route = item({
  id: "route",
  name: "Scout route",
  geometry: {
    type: "LineString",
    coordinates: [
      [-95.2, 47.0],
      [-95.1, 47.0],
    ],
  },
});
const field = item({
  id: "field",
  name: "Hay field",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-95.3, 46.9],
        [-95.3, 47.1],
        [-95.0, 47.1],
        [-95.0, 46.9],
        [-95.3, 46.9],
      ],
    ],
  },
});

describe("identifyMyData", () => {
  it("finds a pin within the click tolerance and no pin outside it", () => {
    expect(titles(identifyMyData([camp], point(-95.1, 47.00005)))).toEqual(["North camp"]);
    expect(identifyMyData([camp], point(-95.1, 47.001))).toEqual([]);
  });

  it("finds a line near any of its segments", () => {
    expect(titles(identifyMyData([route], point(-95.15, 47.00004)))).toEqual(["Scout route"]);
    expect(identifyMyData([route], point(-95.15, 47.001))).toEqual([]);
  });

  it("finds a line at its end points but not beyond them", () => {
    expect(identifyMyData([route], point(-95.2, 47.0))).toHaveLength(1);
    expect(identifyMyData([route], point(-95.21, 47.0))).toEqual([]);
  });

  it("finds a polygon it contains, and one whose edge is within tolerance", () => {
    expect(identifyMyData([field], point(-95.15, 47.0))).toHaveLength(1);
    expect(identifyMyData([field], point(-94.99995, 47.0))).toHaveLength(1);
    expect(identifyMyData([field], point(-94.99, 47.0))).toEqual([]);
  });

  it("lists pins above lines above areas, each newest first", () => {
    const older = item({
      ...camp,
      id: "older",
      name: "Old camp",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    const overlapping = point(-95.1, 47.0);

    const found = titles(identifyMyData([field, route, older, camp], overlapping));

    expect(found).toEqual(["North camp", "Old camp", "Scout route", "Hay field"]);
  });

  it("describes each saved item's kind, note, and location", () => {
    const [result] = identifyMyData([camp], point(-95.1, 47.0));

    expect(result).toMatchObject({
      id: "my-data:camp",
      kind: "my-data",
      sourceName: "My Data",
      detailLabel: "Pin",
      rows: [
        { label: "Location", value: "47.000000, -95.100000" },
        { label: "Note", value: "Flat spot by the creek" },
      ],
    });
    expect(identifyMyData([route], point(-95.15, 47.0))[0].detailLabel).toBe("Line");
    expect(identifyMyData([field], point(-95.15, 47.0))[0].detailLabel).toBe("Area");
  });

  it("omits the note row when an item has no note", () => {
    const [result] = identifyMyData([route], point(-95.15, 47.0));

    expect(result.rows.map((row) => row.label)).toEqual([]);
  });

  it("returns nothing when there are no saved items", () => {
    expect(identifyMyData([], point(-95.1, 47.0))).toEqual([]);
  });
});
