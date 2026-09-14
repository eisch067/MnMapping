import type { InitialCounty } from "@/config/layers/types";

export const minnesotaBounds = {
  west: -97.38,
  south: 43.37,
  east: -89.33,
  north: 49.4,
} as const;

export type LocationKind = "address" | "city" | "coordinate" | "county" | "place";

export interface MapLocation {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  county?: string;
  kind: LocationKind;
}

export interface ViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export const supportedCountyBounds: Record<InitialCounty, ViewportBounds> = {
  Hubbard: { west: -95.21, south: 46.80, east: -94.63, north: 47.40 },
  Beltrami: { west: -95.52, south: 47.39, east: -94.35, north: 48.56 },
  Becker: { west: -96.05, south: 46.56, east: -95.30, north: 47.31 },
  Todd: { west: -95.18, south: 45.79, east: -94.62, north: 46.35 },
  Douglas: { west: -95.70, south: 45.68, east: -95.20, north: 46.19 },
};

export function isInMinnesota(latitude: number, longitude: number): boolean {
  return latitude >= minnesotaBounds.south
    && latitude <= minnesotaBounds.north
    && longitude >= minnesotaBounds.west
    && longitude <= minnesotaBounds.east;
}

export function parseCoordinates(value: string): Pick<MapLocation, "latitude" | "longitude"> | null {
  const numbers = value.trim().match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length !== 2 || numbers.some((number) => !Number.isFinite(number))) return null;

  const [first, second] = numbers;
  const latitude = first >= minnesotaBounds.south && first <= minnesotaBounds.north ? first : second;
  const longitude = latitude === first ? second : first;
  return isInMinnesota(latitude, longitude) ? { latitude, longitude } : null;
}

export function initialCountyForName(county?: string): InitialCounty | undefined {
  if (!county) return undefined;
  const normalized = county.replace(/\s+County$/i, "").trim().toLowerCase();
  const counties: InitialCounty[] = ["Hubbard", "Beltrami", "Becker", "Todd", "Douglas"];
  return counties.find((candidate) => candidate.toLowerCase() === normalized);
}

export function supportedCountiesInViewport(bounds: ViewportBounds): InitialCounty[] {
  return (Object.entries(supportedCountyBounds) as Array<[InitialCounty, ViewportBounds]>)
    .filter(([, countyBounds]) => rectanglesIntersect(bounds, countyBounds))
    .map(([county]) => county);
}

function rectanglesIntersect(first: ViewportBounds, second: ViewportBounds): boolean {
  return first.west <= second.east
    && first.east >= second.west
    && first.south <= second.north
    && first.north >= second.south;
}

export function cameraHeightForLocation(kind: LocationKind): number {
  if (kind === "county") return 115_000;
  if (kind === "city") return 32_000;
  if (kind === "coordinate" || kind === "address") return 7_500;
  return 20_000;
}
