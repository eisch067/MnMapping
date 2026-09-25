interface ArcGisLayerMetadata {
  maxRecordCount?: number;
  objectIdField?: string;
  objectIdFieldName?: string;
  advancedQueryCapabilities?: {
    supportsPagination?: boolean;
    supportsOrderBy?: boolean;
  };
  error?: ArcGisError;
}

export interface ArcGisError {
  code?: number;
  message?: string;
  details?: string[];
}

interface ArcGisFeatureCollection {
  type: "FeatureCollection";
  features: Array<Record<string, unknown>>;
  exceededTransferLimit?: boolean;
  error?: ArcGisError;
  [key: string]: unknown;
}

export interface ArcGisQueryProgress {
  loaded: number;
  page: number;
}

export interface ArcGisFeatureQueryOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ArcGisQueryProgress) => void;
  fetcher?: typeof fetch;
}

const metadataCache = new Map<string, Promise<ArcGisLayerMetadata>>();
const fallbackPageSize = 1_000;
const maximumPages = 1_000;

export async function fetchAllArcGisFeatures(
  queryUrl: URL,
  options: ArcGisFeatureQueryOptions = {},
): Promise<ArcGisFeatureCollection> {
  const fetcher = options.fetcher ?? fetch;
  const layerUrl = queryUrl.toString().replace(/\/query(?:\?.*)?$/, "");
  const metadata = await fetchLayerMetadata(layerUrl, fetcher, options.signal);
  const objectIdField = metadata.objectIdField ?? metadata.objectIdFieldName;
  const pageSize = Math.max(1, Math.min(metadata.maxRecordCount ?? fallbackPageSize, 2_000));

  if (metadata.advancedQueryCapabilities?.supportsPagination === false) {
    return fetchByObjectIds(queryUrl, objectIdField, pageSize, fetcher, options);
  }

  const features: Array<Record<string, unknown>> = [];
  const pageFingerprints = new Set<string>();
  let template: ArcGisFeatureCollection | undefined;
  for (let page = 0; page < maximumPages; page += 1) {
    const pageUrl = new URL(queryUrl);
    pageUrl.searchParams.set("resultOffset", String(page * pageSize));
    pageUrl.searchParams.set("resultRecordCount", String(pageSize));
    if (objectIdField && metadata.advancedQueryCapabilities?.supportsOrderBy !== false) {
      pageUrl.searchParams.set("orderByFields", `${objectIdField} ASC`);
    }
    const response = await fetchJson<ArcGisFeatureCollection>(pageUrl, fetcher, options.signal);
    throwForArcGisError(response.error, pageUrl);
    const fingerprint = pageFingerprint(response.features);
    if (response.features.length > 0 && pageFingerprints.has(fingerprint)) {
      throw new Error("ArcGIS returned a repeated page; this service cannot be paginated safely.");
    }
    pageFingerprints.add(fingerprint);
    template ??= response;
    features.push(...response.features);
    options.onProgress?.({ loaded: features.length, page: page + 1 });
    if (!response.exceededTransferLimit && response.features.length < pageSize) {
      return { ...template, features, exceededTransferLimit: false };
    }
    if (response.features.length === 0) {
      return { ...template, features, exceededTransferLimit: false };
    }
  }
  throw new Error(`ArcGIS query exceeded the ${maximumPages.toLocaleString("en-US")}-page safety limit.`);
}

async function fetchByObjectIds(
  queryUrl: URL,
  objectIdField: string | undefined,
  pageSize: number,
  fetcher: typeof fetch,
  options: ArcGisFeatureQueryOptions,
): Promise<ArcGisFeatureCollection> {
  const idsUrl = new URL(queryUrl);
  idsUrl.searchParams.delete("outFields");
  idsUrl.searchParams.delete("returnGeometry");
  idsUrl.searchParams.delete("outSR");
  idsUrl.searchParams.delete("geometryPrecision");
  idsUrl.searchParams.set("returnIdsOnly", "true");
  idsUrl.searchParams.set("f", "json");
  const idsResponse = await fetchJson<{ objectIds?: number[]; objectIdFieldName?: string; error?: ArcGisError }>(idsUrl, fetcher, options.signal);
  throwForArcGisError(idsResponse.error, idsUrl);
  const objectIds = idsResponse.objectIds ?? [];
  const stableObjectIdField = objectIdField ?? idsResponse.objectIdFieldName;
  const features: Array<Record<string, unknown>> = [];
  let template: ArcGisFeatureCollection = { type: "FeatureCollection", features: [] };
  for (let offset = 0; offset < objectIds.length; offset += pageSize) {
    const pageUrl = new URL(queryUrl);
    pageUrl.searchParams.delete("geometry");
    pageUrl.searchParams.delete("geometryType");
    pageUrl.searchParams.delete("inSR");
    pageUrl.searchParams.delete("spatialRel");
    pageUrl.searchParams.set("objectIds", objectIds.slice(offset, offset + pageSize).join(","));
    if (stableObjectIdField) pageUrl.searchParams.set("orderByFields", `${stableObjectIdField} ASC`);
    const response = await fetchJson<ArcGisFeatureCollection>(pageUrl, fetcher, options.signal);
    throwForArcGisError(response.error, pageUrl);
    if (offset === 0) template = response;
    features.push(...response.features);
    options.onProgress?.({ loaded: features.length, page: Math.floor(offset / pageSize) + 1 });
  }
  return { ...template, features, exceededTransferLimit: false };
}

async function fetchLayerMetadata(layerUrl: string, fetcher: typeof fetch, signal?: AbortSignal) {
  let pending = metadataCache.get(layerUrl);
  if (!pending) {
    const url = new URL(layerUrl);
    url.searchParams.set("f", "json");
    pending = fetchJson<ArcGisLayerMetadata>(url, fetcher, signal).then((metadata) => {
      throwForArcGisError(metadata.error, url);
      return metadata;
    });
    metadataCache.set(layerUrl, pending);
    pending.catch(() => metadataCache.delete(layerUrl));
  }
  return pending;
}

export async function fetchJson<T>(
  url: URL,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetcher(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`ArcGIS request failed (${response.status} ${response.statusText}).`);
  return response.json() as Promise<T>;
}

export function throwForArcGisError(error: ArcGisError | undefined, url: URL) {
  if (!error) return;
  const detail = [error.message, ...(error.details ?? [])].filter(Boolean).join(" ");
  throw new Error(`ArcGIS error${error.code ? ` ${error.code}` : ""}: ${detail || `query failed at ${url.pathname}`}`);
}

function pageFingerprint(features: Array<Record<string, unknown>>): string {
  if (features.length === 0) return "empty";
  return JSON.stringify([features.length, features[0], features.at(-1)]);
}
