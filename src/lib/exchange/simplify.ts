export type Coordinate = [number, number];

function distanceToSegment(point: Coordinate, start: Coordinate, end: Coordinate): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

// Douglas-Peucker run once, recording how large a tolerance it takes to drop each vertex. A vertex
// survives a tolerance only if it and every vertex it was split from are farther than it.
function vertexImportance(points: readonly Coordinate[]): Float64Array {
  const importance = new Float64Array(points.length);
  importance[0] = Number.POSITIVE_INFINITY;
  importance[points.length - 1] = Number.POSITIVE_INFINITY;
  const pending: [number, number, number][] = [[0, points.length - 1, Number.POSITIVE_INFINITY]];
  for (let range = pending.pop(); range; range = pending.pop()) {
    const [low, high, inherited] = range;
    let farthest = -1;
    let farthestDistance = -1;
    for (let index = low + 1; index < high; index++) {
      const distance = distanceToSegment(points[index] as Coordinate, points[low] as Coordinate, points[high] as Coordinate);
      if (distance > farthestDistance) {
        farthest = index;
        farthestDistance = distance;
      }
    }
    if (farthest < 0) continue;
    const effective = Math.min(farthestDistance, inherited);
    importance[farthest] = effective;
    pending.push([low, farthest, effective], [farthest, high, effective]);
  }
  return importance;
}

// The smallest tolerance that leaves at most `limit` vertices; the endpoints always stay.
export function simplifyToLimit(points: readonly Coordinate[], limit: number): Coordinate[] {
  if (points.length <= limit) return [...points];
  const importance = vertexImportance(points);
  const inner = Array.from(importance.subarray(1, points.length - 1)).sort((a, b) => b - a);
  const tolerance = inner[limit - 2] ?? 0;
  return points.filter((_, index) => importance[index] === Number.POSITIVE_INFINITY || (importance[index] as number) > tolerance);
}

// A closed ring is simplified as an open line, then closed again.
export function simplifyRingToLimit(ring: readonly Coordinate[], limit: number): Coordinate[] {
  if (ring.length <= limit) return [...ring];
  const simplified = simplifyToLimit(ring.slice(0, -1), limit - 1);
  return [...simplified, simplified[0] as Coordinate];
}
