import { countyRegistry, type SupportedCounty } from "@/config/counties";

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

export const supportedCountyBounds = Object.fromEntries(
  countyRegistry.map((county) => [county.name, county.bounds]),
) as Record<SupportedCounty, ViewportBounds>;

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

export function initialCountyForName(county?: string): SupportedCounty | undefined {
  if (!county) return undefined;
  const normalized = county.replace(/\s+County$/i, "").trim().toLowerCase();
  return countyRegistry.find((candidate) => candidate.name.toLowerCase() === normalized)?.name;
}

export function supportedCountiesInViewport(bounds: ViewportBounds): SupportedCounty[] {
  return countyRegistry
    .filter((county) => rectanglesIntersect(bounds, county.bounds))
    .map((county) => county.name as SupportedCounty);
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
