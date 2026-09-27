import { Geodesic } from "geographiclib-geodesic";

export type Position = readonly [longitude: number, latitude: number];

export interface PolygonMeasurements {
  areaSquareMeters: number;
  perimeterMeters: number;
}

export function geodesicDistanceMeters(start: Position, end: Position): number {
  return Geodesic.WGS84.Inverse(start[1], start[0], end[1], end[0]).s12;
}

export function geodesicLengthMeters(coordinates: readonly Position[]): number {
  return coordinates.slice(1).reduce(
    (total, point, index) => total + geodesicDistanceMeters(coordinates[index], point),
    0,
  );
}

export function geodesicMidpoint(start: Position, end: Position): Position {
  const inverse = Geodesic.WGS84.Inverse(start[1], start[0], end[1], end[0]);
  const midpoint = Geodesic.WGS84.Direct(start[1], start[0], inverse.azi1, inverse.s12 / 2);
  return [midpoint.lon2, midpoint.lat2];
}

export function geodesicPolygonMeasurements(ring: readonly Position[]): PolygonMeasurements {
  if (ring.length < 3) return { areaSquareMeters: 0, perimeterMeters: 0 };
  const polygon = Geodesic.WGS84.Polygon(false);
  const lastIndex = ring.length - 1;
  const pointCount = positionsEqual(ring[0], ring[lastIndex]) ? lastIndex : ring.length;
  for (let index = 0; index < pointCount; index += 1) {
    const [longitude, latitude] = ring[index];
    polygon.AddPoint(latitude, longitude);
  }
  const result = polygon.Compute(false, true);
  return { areaSquareMeters: Math.abs(result.area), perimeterMeters: result.perimeter };
}

function positionsEqual(first: Position, second: Position): boolean {
  return first[0] === second[0] && first[1] === second[1];
}
