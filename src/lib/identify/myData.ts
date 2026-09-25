import type { MyGeometry, MyMapItem } from "@/lib/myData";
import type { IdentifyPoint, IdentifyResult, IdentifyRow } from "./types";

type Position = [number, number];

const metersPerDegree = 111_320;
// Saved items are drawn pins over lines over areas, so that is the order they are offered in.
const kindOrder: Record<MyGeometry["type"], number> = { Point: 0, LineString: 1, Polygon: 2 };
const kindLabels: Record<MyGeometry["type"], string> = {
  Point: "Pin",
  LineString: "Line",
  Polygon: "Area",
};

interface Plane {
  x: number;
  y: number;
}

// Positions are measured from the click in meters. A click's tolerance is a few meters, so a
// flat plane at the click's latitude is exact enough.
function toPlane(position: Position, origin: IdentifyPoint): Plane {
  const scale = Math.cos((origin.latitude * Math.PI) / 180);
  return {
    x: (position[0] - origin.longitude) * metersPerDegree * scale,
    y: (position[1] - origin.latitude) * metersPerDegree,
  };
}

function distanceToSegment(start: Plane, end: Plane): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const along = lengthSquared === 0 ? 0 : -(start.x * dx + start.y * dy) / lengthSquared;
  const t = Math.min(1, Math.max(0, along));
  return Math.hypot(start.x + t * dx, start.y + t * dy);
}

function distanceToPath(path: readonly Position[], origin: IdentifyPoint): number {
  const planar = path.map((position) => toPlane(position, origin));
  if (planar.length === 1) return Math.hypot(planar[0].x, planar[0].y);
  return Math.min(
    ...planar.slice(1).map((end, index) => distanceToSegment(planar[index], end)),
  );
}

// Ray casting from the click, which sits at the plane's origin.
function ringContainsOrigin(ring: readonly Position[], origin: IdentifyPoint): boolean {
  const planar = ring.map((position) => toPlane(position, origin));
  let inside = false;
  for (let index = 0, previous = planar.length - 1; index < planar.length; previous = index++) {
    const a = planar[index];
    const b = planar[previous];
    const crossesRay = a.y > 0 !== b.y > 0;
    const crossingX = a.x - (a.y * (b.x - a.x)) / (b.y - a.y);
    if (crossesRay && crossingX > 0) inside = !inside;
  }
  return inside;
}

function isUnderClick(geometry: MyGeometry, point: IdentifyPoint): boolean {
  switch (geometry.type) {
    case "Point":
      return distanceToPath([geometry.coordinates], point) <= point.toleranceMeters;
    case "LineString":
      return distanceToPath(geometry.coordinates, point) <= point.toleranceMeters;
    case "Polygon": {
      const outline = geometry.coordinates[0] ?? [];
      const isNearEdge = distanceToPath(outline, point) <= point.toleranceMeters;
      return ringContainsOrigin(outline, point) || isNearEdge;
    }
  }
}

function describeItem(item: MyMapItem): IdentifyResult {
  const rows: IdentifyRow[] = [];
  if (item.geometry.type === "Point") {
    const [longitude, latitude] = item.geometry.coordinates;
    rows.push({ label: "Location", value: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
  }
  if (item.note) rows.push({ label: "Note", value: item.note });
  return {
    id: `my-data:${item.id}`,
    kind: "my-data",
    sourceName: "My Data",
    title: item.name,
    detailLabel: kindLabels[item.geometry.type],
    rows,
    notes: [],
    links: [],
  };
}

export function identifyMyData(
  items: readonly MyMapItem[],
  point: IdentifyPoint,
): IdentifyResult[] {
  return items
    .filter((item) => isUnderClick(item.geometry, point))
    .toSorted(
      (first, second) =>
        kindOrder[first.geometry.type] - kindOrder[second.geometry.type] ||
        second.createdAt.localeCompare(first.createdAt),
    )
    .map(describeItem);
}
