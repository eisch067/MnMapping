import type { MyGeometry } from "@/lib/myDataModel";
import { simplifyRingToLimit, simplifyToLimit, type Coordinate } from "./simplify";

export const MAX_ITEM_VERTICES = 20_000;

// A position as read from a file: anything that is not a finite number pair is caught here.
export type RawPosition = readonly number[];

export type RawPart =
  | { type: "Point"; position: RawPosition }
  | { type: "LineString"; positions: readonly RawPosition[] }
  | { type: "Polygon"; rings: readonly (readonly RawPosition[])[] };

export interface NormalizeTally {
  holesRemoved: number;
  simplified: number;
}

export type NormalizedPart = { geometry: MyGeometry } | { reason: string };

const invalidPair = "A coordinate is not a valid longitude and latitude pair.";

function checkPosition(position: RawPosition): Coordinate | string {
  const [longitude, latitude] = position;
  if (longitude === undefined || latitude === undefined) return invalidPair;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return invalidPair;
  if (longitude < -180 || longitude > 180) return `Longitude ${longitude} is outside -180 to 180.`;
  if (latitude < -90 || latitude > 90) return `Latitude ${latitude} is outside -90 to 90.`;
  return [longitude, latitude];
}

function checkPositions(positions: readonly RawPosition[]): Coordinate[] | string {
  const checked: Coordinate[] = [];
  for (const position of positions) {
    const result = checkPosition(position);
    if (typeof result === "string") return result;
    checked.push(result);
  }
  return checked;
}

function distinctCount(points: readonly Coordinate[]): number {
  return new Set(points.map(([longitude, latitude]) => `${longitude},${latitude}`)).size;
}

function normalizeLine(positions: readonly RawPosition[], tally: NormalizeTally): NormalizedPart {
  const points = checkPositions(positions);
  if (typeof points === "string") return { reason: points };
  if (distinctCount(points) < 2) return { reason: "A line needs at least 2 distinct points." };
  if (points.length <= MAX_ITEM_VERTICES)
    return { geometry: { type: "LineString", coordinates: points } };
  tally.simplified++;
  return {
    geometry: { type: "LineString", coordinates: simplifyToLimit(points, MAX_ITEM_VERTICES) },
  };
}

function normalizePolygon(
  rings: readonly (readonly RawPosition[])[],
  tally: NormalizeTally,
): NormalizedPart {
  const points = checkPositions(rings[0] ?? []);
  if (typeof points === "string") return { reason: points };
  if (distinctCount(points) < 3) return { reason: "An area needs at least 3 distinct vertices." };
  tally.holesRemoved += rings.length - 1;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return { reason: "An area needs at least 3 distinct vertices." };
  const closed = first[0] === last[0] && first[1] === last[1] ? points : [...points, first];
  if (closed.length <= MAX_ITEM_VERTICES)
    return { geometry: { type: "Polygon", coordinates: [closed] } };
  tally.simplified++;
  return {
    geometry: { type: "Polygon", coordinates: [simplifyRingToLimit(closed, MAX_ITEM_VERTICES)] },
  };
}

export function normalizePart(part: RawPart, tally: NormalizeTally): NormalizedPart {
  if (part.type === "Point") {
    const point = checkPosition(part.position);
    return typeof point === "string"
      ? { reason: point }
      : { geometry: { type: "Point", coordinates: point } };
  }
  return part.type === "LineString"
    ? normalizeLine(part.positions, tally)
    : normalizePolygon(part.rings, tally);
}
