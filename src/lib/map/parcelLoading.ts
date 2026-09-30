import type { LayerBounds } from "@/config/layers/types";

export const parcelZoomThresholds = {
  detailedBelowMeters: 5_000,
  mediumBelowMeters: 15_000,
  maximumMeters: 35_000,
} as const;

export type ParcelZoomBand = "detailed" | "medium" | "wide" | "hidden";

export function parcelZoomBand(cameraHeight: number): ParcelZoomBand {
  if (cameraHeight < parcelZoomThresholds.detailedBelowMeters) return "detailed";
  if (cameraHeight < parcelZoomThresholds.mediumBelowMeters) return "medium";
  if (cameraHeight <= parcelZoomThresholds.maximumMeters) return "wide";
  return "hidden";
}

export function statewideParcelQuery(
  baseWhere: string,
  cameraHeight: number,
  acreageField: string,
  bounds: LayerBounds,
  screenWidthPixels: number,
) {
  const band = parcelZoomBand(cameraHeight);
  const acreage = band === "medium" ? 10 : band === "wide" ? 40 : undefined;
  const where = acreage === undefined
    ? baseWhere
    : `(${baseWhere}) AND ${acreageField} >= ${acreage}`;
  const marginX = (bounds.east - bounds.west) / 2;
  const marginY = (bounds.north - bounds.south) / 2;
  const widenedBounds = {
    west: Math.max(-180, bounds.west - marginX),
    south: Math.max(-90, bounds.south - marginY),
    east: Math.min(180, bounds.east + marginX),
    north: Math.min(90, bounds.north + marginY),
  };

  return {
    band,
    where,
    bounds: widenedBounds,
    maxAllowableOffset: band === "detailed" || band === "hidden"
      ? undefined
      : (bounds.east - bounds.west) / Math.max(1, screenWidthPixels),
  };
}
