import { describe, expect, it } from "vitest";
import { layerRegistry } from "@/config/layers";
import { awaitsZoom } from "@/lib/dnr/zoom";

const waterAccess = layerRegistry.find((layer) => layer.id === "mndnr-public-water-access")!;
const deer = layerRegistry.find((layer) => layer.id === "mndnr-deer-permit-areas")!;
const publicWma = layerRegistry.find((layer) => layer.id === "mndnr-public-wmas")!;

describe("awaitsZoom", () => {
  it("is true for a layer that is on but too far away to load", () => {
    expect(awaitsZoom(waterAccess, true, 2_000_000)).toBe(true);
  });

  it("is false once the camera is within the layer's loading height", () => {
    expect(awaitsZoom(waterAccess, true, 150_000)).toBe(false);
    expect(awaitsZoom(waterAccess, true, 20_000)).toBe(false);
  });

  it("is false while the layer is off, so an unused row shows no hint", () => {
    expect(awaitsZoom(waterAccess, false, 2_000_000)).toBe(false);
  });

  it("is false for a layer that loads at any height", () => {
    expect(awaitsZoom(deer, true, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("is false before the camera height is known", () => {
    expect(awaitsZoom(waterAccess, true, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("leaves layers outside DNR Recreation to their own behavior", () => {
    const limited = { ...publicWma, options: { ...publicWma.options, maxCameraHeight: 1_000 } };

    expect(awaitsZoom(limited, true, 2_000_000)).toBe(false);
  });
});
