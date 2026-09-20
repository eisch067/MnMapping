import type { MapLocation } from "@/lib/location";

const recentKey = "mnmapping.recent-locations.v1";
const savedKey = "mnmapping.saved-locations.v1";
const maxRecent = 8;

export function loadRecentLocations(): MapLocation[] {
  return readList(recentKey);
}

export function recordRecentLocation(location: MapLocation): void {
  const next = [location, ...readList(recentKey).filter((entry) => entry.id !== location.id)].slice(0, maxRecent);
  writeList(recentKey, next);
}

export function clearRecentLocations(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(recentKey);
  } catch {
    // Private browsing and storage policies can make localStorage unavailable.
  }
}

export function loadSavedLocations(): MapLocation[] {
  return readList(savedKey);
}

export function isLocationSaved(id: string, savedLocations: readonly MapLocation[]): boolean {
  return savedLocations.some((entry) => entry.id === id);
}

export function saveLocation(location: MapLocation): MapLocation[] {
  const next = [location, ...readList(savedKey).filter((entry) => entry.id !== location.id)];
  writeList(savedKey, next);
  return next;
}

export function removeSavedLocation(id: string): MapLocation[] {
  const next = readList(savedKey).filter((entry) => entry.id !== id);
  writeList(savedKey, next);
  return next;
}

function readList(key: string): MapLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return Array.isArray(value) ? value.filter(isMapLocation) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: readonly MapLocation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Private browsing and storage policies can make localStorage unavailable.
  }
}

function isMapLocation(value: unknown): value is MapLocation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string"
    && typeof candidate.label === "string"
    && typeof candidate.latitude === "number"
    && typeof candidate.longitude === "number"
    && typeof candidate.kind === "string";
}
