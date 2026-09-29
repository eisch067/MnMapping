import { geodesicDistanceMeters, geodesicPointAt, type Position } from "@/lib/geodesy";
import { authoritativeElevationSource } from "@/config/elevation";
import type { ElevationSample } from "@/lib/measurements";

const maximumSamplesPerRequest = 80;
const maximumProfileSamples = 2_000;
const profileSpacingMeters = 10;
const maximumConcurrentRequests = 3;

interface SampleResponse {
  samples?: { locationId: number; value: string | number }[];
  error?: { message?: string };
}

export function profilePositions(coordinates: readonly Position[]): Position[] {
  const waypoints = limitWaypoints(coordinates);
  const lengths = waypoints.slice(1).map((point, index) =>
    geodesicDistanceMeters(waypoints[index], point));
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  if (!Number.isFinite(totalLength) || totalLength <= 0) return [...coordinates];
  const interval = Math.max(profileSpacingMeters, totalLength / (maximumProfileSamples - 1));
  const positions: Position[] = [];
  for (let segmentIndex = 0; segmentIndex < lengths.length; segmentIndex += 1) {
    const start = waypoints[segmentIndex];
    const end = waypoints[segmentIndex + 1];
    const divisions = Math.max(1, Math.ceil(lengths[segmentIndex] / interval));
    for (let step = 0; step < divisions; step += 1) {
      positions.push(geodesicPointAt(start, end, step / divisions));
    }
  }
  positions.push(waypoints[waypoints.length - 1]);
  return positions;
}

function limitWaypoints(coordinates: readonly Position[]): Position[] {
  if (coordinates.length <= maximumProfileSamples) return [...coordinates];
  return Array.from({ length: maximumProfileSamples }, (_, index) => {
    const sourceIndex = Math.round(index * (coordinates.length - 1) / (maximumProfileSamples - 1));
    return coordinates[sourceIndex];
  });
}

export async function sampleElevations(
  positions: readonly Position[],
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<ElevationSample[]> {
  if (positions.length === 0) return [];
  const chunks = positions.reduce<Position[][]>((result, position, index) => {
    const chunkIndex = Math.floor(index / maximumSamplesPerRequest);
    result[chunkIndex] ??= [];
    result[chunkIndex].push(position);
    return result;
  }, []);
  const elevations = new Array<number>(positions.length);
  let nextChunk = 0;
  const workers = Array.from(
    { length: Math.min(maximumConcurrentRequests, chunks.length) },
    async () => {
      while (nextChunk < chunks.length) {
        const chunkIndex = nextChunk++;
        const values = await fetchChunk(chunks[chunkIndex], fetcher, signal);
        values.forEach((elevation, index) => {
          elevations[chunkIndex * maximumSamplesPerRequest + index] = elevation;
        });
      }
    },
  );
  await Promise.all(workers);
  return positions.map((position, index) => ({ position, elevationMeters: elevations[index] }));
}

async function fetchChunk(positions: readonly Position[], fetcher: typeof fetch, signal?: AbortSignal): Promise<number[]> {
  const geometry = JSON.stringify({
    spatialReference: { wkid: 4326 },
    points: positions.map(([longitude, latitude]) => [longitude, latitude]),
  });
  const baseUrl = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${authoritativeElevationSource.browserUrl}/getSamples`, baseUrl);
  url.searchParams.set("geometry", geometry);
  url.searchParams.set("geometryType", "esriGeometryMultipoint");
  url.searchParams.set("returnFirstValueOnly", "true");
  url.searchParams.set("interpolation", "RSP_BilinearInterpolation");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "json");
  const response = await fetcher(url, signal ? { signal } : undefined);
  if (!response.ok) throw new Error("Minnesota DEM sampling is unavailable.");
  const payload = await response.json() as SampleResponse;
  if (payload.error) throw new Error(payload.error.message ?? "Minnesota DEM sampling failed.");
  const values = new Array<number>(positions.length);
  for (const sample of payload.samples ?? []) {
    const value = Number(sample.value);
    if (Number.isInteger(sample.locationId) && sample.locationId >= 0 && sample.locationId < values.length
      && Number.isFinite(value)) values[sample.locationId] = value;
  }
  if (values.filter(Number.isFinite).length !== positions.length) {
    throw new Error("The Minnesota DEM has no elevation value for part of this line.");
  }
  return values;
}
