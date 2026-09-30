import type { CountyDefinition } from "@/config/layers/types";

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}

const earthRadiusMiles = 3958.7613;

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function distanceMiles(first: GeographicPoint, second: GeographicPoint): number {
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude))
      * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
}

// County bounds conservatively represent county extents; clamping to the rectangle finds
// the nearest point, so counties whose extent only partly enters the radius are included.
export function countiesInParcelRange(
  center: GeographicPoint,
  counties: readonly Pick<CountyDefinition, "name" | "bounds">[],
  radiusMiles = 50,
): string[] {
  return counties
    .filter((county) => {
      const nearest = {
        latitude: Math.max(county.bounds.south, Math.min(center.latitude, county.bounds.north)),
        longitude: Math.max(county.bounds.west, Math.min(center.longitude, county.bounds.east)),
      };
      return distanceMiles(center, nearest) <= radiusMiles;
    })
    .map(({ name }) => name);
}
