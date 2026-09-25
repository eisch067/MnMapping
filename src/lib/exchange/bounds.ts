import type { MyGeometry } from "@/lib/myDataModel";

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Wide enough that a single pin still frames a neighborhood rather than a point.
const MINIMUM_SPAN_DEGREES = 0.01;
const PADDING_RATIO = 0.1;

function positions(geometry: MyGeometry): [number, number][] {
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "LineString") return geometry.coordinates;
  return geometry.coordinates.flat();
}

export function boundsOf(geometries: readonly MyGeometry[]): Bounds | null {
  const all = geometries.flatMap(positions);
  if (all.length === 0) return null;
  const longitudes = all.map(([longitude]) => longitude);
  const latitudes = all.map(([, latitude]) => latitude);
  const grow = (low: number, high: number, limit: number): [number, number] => {
    const pad = Math.max(
      (high - low) * PADDING_RATIO,
      (MINIMUM_SPAN_DEGREES - (high - low)) / 2,
      0,
    );
    return [Math.max(low - pad, -limit), Math.min(high + pad, limit)];
  };
  const [west, east] = grow(Math.min(...longitudes), Math.max(...longitudes), 180);
  const [south, north] = grow(Math.min(...latitudes), Math.max(...latitudes), 90);
  return { west, south, east, north };
}
