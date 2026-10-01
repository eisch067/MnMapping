interface Lod {
  level: number;
  scale: number;
}

interface MapServerMetadata {
  error?: { message?: string };
  singleFusedMapCache?: boolean;
  minScale?: number;
  tileInfo?: { spatialReference?: { wkid?: number; latestWkid?: number }; lods?: Lod[] };
}

const WEB_MERCATOR_WKIDS = new Set([102100, 102113, 900913, 3857]);
// Metadata prints scales with limited precision, so an exact match can miss by a rounding step.
const SCALE_TOLERANCE = 1 + 1e-6;

// Many county caches start deeper than level 0 (Becker's starts at 9) and answer every shallower
// tile with a 404. Cesium's ArcGIS provider always reports level 0, so this finds the real start.
export function firstCachedLevel(metadata: MapServerMetadata): number {
  const { minScale, tileInfo } = metadata;
  const wkid = tileInfo?.spatialReference?.latestWkid ?? tileInfo?.spatialReference?.wkid;
  if (!metadata.singleFusedMapCache || !minScale || !wkid || !WEB_MERCATOR_WKIDS.has(wkid)) return 0;
  const first = tileInfo?.lods?.find((lod) => lod.scale <= minScale * SCALE_TOLERANCE);
  return first?.level ?? 0;
}

export async function fetchFirstCachedLevel(serviceUrl: string): Promise<number> {
  const response = await fetch(`${serviceUrl}?f=json`);
  if (!response.ok) {
    throw new Error(`Could not read ArcGIS service metadata from ${serviceUrl} (HTTP ${response.status}).`);
  }
  const metadata: MapServerMetadata = await response.json();
  if (metadata.error) {
    throw new Error(`Could not read ArcGIS service metadata from ${serviceUrl}: ${metadata.error.message ?? "The service returned an error."}`);
  }
  return firstCachedLevel(metadata);
}
