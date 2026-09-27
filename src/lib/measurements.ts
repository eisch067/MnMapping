import type { AreaUnit, DistanceUnit, PrimaryDimension } from "./myData";
import { geodesicDistanceMeters, geodesicLengthMeters, geodesicPolygonMeasurements, type Position } from "./geodesy";

const distanceFactors: Record<DistanceUnit, number> = {
  meters: 1,
  kilometers: 1 / 1000,
  feet: 3.280839895,
  miles: 1 / 1609.344,
};

const areaFactors: Record<AreaUnit, number> = {
  acres: 1 / 4046.8564224,
  "square-feet": 10.763910417,
  "square-miles": 1 / 2_589_988.110336,
  hectares: 1 / 10_000,
};

const distanceLabels: Record<DistanceUnit, string> = {
  meters: "m",
  kilometers: "km",
  feet: "ft",
  miles: "mi",
};

const areaLabels: Record<AreaUnit, string> = {
  acres: "ac",
  "square-feet": "ft²",
  "square-miles": "mi²",
  hectares: "ha",
};

export function formatDistance(meters: number, unit: DistanceUnit): string {
  return `${formatValue(meters * distanceFactors[unit])} ${distanceLabels[unit]}`;
}

export function formatArea(squareMeters: number, unit: AreaUnit): string {
  return `${formatValue(squareMeters * areaFactors[unit])} ${areaLabels[unit]}`;
}

export interface ElevationSample {
  position: Position;
  elevationMeters: number;
}

export function sampledLineDistanceMeters(
  coordinates: readonly Position[],
  kind: "direct" | "ground",
  samples: readonly ElevationSample[],
): number | null {
  if (kind === "direct") {
    if (samples.length !== coordinates.length) return null;
    return coordinates.slice(1).reduce((total, point, index) => {
      const horizontal = geodesicDistanceMeters(coordinates[index], point);
      const vertical = samples[index + 1].elevationMeters - samples[index].elevationMeters;
      return total + Math.hypot(horizontal, vertical);
    }, 0);
  }
  if (samples.length < 2) return null;
  return samples.slice(1).reduce((total, sample, index) => {
    const previous = samples[index];
    return total + Math.hypot(
      geodesicDistanceMeters(previous.position, sample.position),
      sample.elevationMeters - previous.elevationMeters,
    );
  }, 0);
}

export function primaryDimensionLabel(
  coordinates: readonly Position[],
  dimension: PrimaryDimension,
  samples: readonly ElevationSample[] = [],
): string | null {
  if (!dimension || !coordinates.length) return null;
  if (dimension.kind === "horizontal") {
    return formatDistance(geodesicLengthMeters(coordinates), dimension.unit);
  }
  if (dimension.kind === "direct" || dimension.kind === "ground") {
    const distance = sampledLineDistanceMeters(coordinates, dimension.kind, samples);
    return distance === null ? null : formatDistance(distance, dimension.unit);
  }
  if (!("areaUnit" in dimension)) return null;
  const measurements = geodesicPolygonMeasurements(coordinates);
  const area = formatArea(measurements.areaSquareMeters, dimension.areaUnit);
  const perimeter = formatDistance(measurements.perimeterMeters, dimension.perimeterUnit);
  if (dimension.kind === "area") return area;
  if (dimension.kind === "perimeter") return perimeter;
  return `${area} · ${perimeter}`;
}

function formatValue(value: number): string {
  const maximumFractionDigits = value < 10 ? 2 : value < 100 ? 1 : 0;
  return value.toLocaleString("en-US", { maximumFractionDigits });
}
