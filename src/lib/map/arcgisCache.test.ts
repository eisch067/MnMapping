import { describe, expect, it } from "vitest";
import { firstCachedLevel } from "@/lib/map/arcgisCache";

const webMercatorLods = [
  { level: 7, scale: 4622324.434309 },
  { level: 8, scale: 2311162.217155 },
  { level: 9, scale: 1155581.108577 },
  { level: 10, scale: 577790.554289 },
];

function cachedService(minScale: number, wkid = 102100) {
  return {
    singleFusedMapCache: true,
    minScale,
    tileInfo: { spatialReference: { wkid }, lods: webMercatorLods },
  };
}

describe("firstCachedLevel", () => {
  it("returns the first level whose scale fits inside the service's minimum scale", () => {
    expect(firstCachedLevel(cachedService(1155581.108577))).toBe(9);
    expect(firstCachedLevel(cachedService(600000))).toBe(10);
  });

  it("tolerates rounding in the published minimum scale", () => {
    expect(firstCachedLevel(cachedService(1155581.1))).toBe(9);
  });

  it("starts at level 0 when the service has no scale limit, cache, or Web Mercator grid", () => {
    expect(firstCachedLevel(cachedService(0))).toBe(0);
    expect(firstCachedLevel({ ...cachedService(1155581.108577), singleFusedMapCache: false })).toBe(0);
    expect(firstCachedLevel(cachedService(1155581.108577, 26915))).toBe(0);
    expect(firstCachedLevel({})).toBe(0);
  });

  it("starts at level 0 when no cached level is fine enough", () => {
    expect(firstCachedLevel(cachedService(1000))).toBe(0);
  });
});
