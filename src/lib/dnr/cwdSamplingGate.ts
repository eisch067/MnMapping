import type { LayerDefinition } from "@/config/layers/types";
import { absoluteBrowserUrl } from "@/lib/map/layerOptions";
import type { SeasonGate } from "./season";

const configuredPeriod = "July 2026 - June 2027";
const configuredYear = 2026;
const itemId = "8462b6a81c46461484c68d4bd638134c";
const officialUrl = "https://www.dnr.state.mn.us/cwd/index.html";
const expectedFields = [
  "sitename", "nearestcity", "servicetype", "cwdareas", "dpa", "sampletime", "selfsrtime",
  "address", "directions", "notes", "admin", "last_edited_date", "moredetail", "show",
];

interface ArcGisJson {
  error?: { message?: string };
  features?: Array<{ attributes?: Record<string, unknown> }>;
  fields?: Array<{ name?: string }>;
  title?: string;
  name?: string;
  serviceDescription?: string;
  layers?: Array<{ id?: number; name?: string }>;
}

export interface CwdGateRequest {
  fetcher: typeof fetch;
  now: Date;
  signal?: AbortSignal;
}

async function readJson(url: URL, request: CwdGateRequest): Promise<ArcGisJson> {
  url.searchParams.set("f", "json");
  const response = await request.fetcher(url, { signal: request.signal, cache: "no-store" });
  if (!response.ok) throw new Error(`CWD verification returned ${response.status}`);
  const data: ArcGisJson = await response.json();
  if (data.error) throw new Error(data.error.message ?? "CWD verification failed");
  return data;
}

function endpoint(layer: LayerDefinition, suffix: string): URL {
  const base = absoluteBrowserUrl(layer.url);
  return new URL(suffix ? `${base}/${suffix}` : base);
}

function unavailable(layer: LayerDefinition): SeasonGate {
  return {
    status: "unverified",
    lastVerified: configuredPeriod,
    officialUrl: layer.dnr?.verifyUrl ?? officialUrl,
  };
}

function periodIsCurrent(value: unknown, now: Date): value is string {
  if (typeof value !== "string" || value.trim() !== configuredPeriod) return false;
  const start = Date.UTC(configuredYear, 6, 1);
  const end = Date.UTC(configuredYear + 1, 6, 1);
  return now.getTime() >= start && now.getTime() < end;
}

function titleHasYear(metadata: ArcGisJson): boolean {
  const title = `${metadata.title ?? ""} ${metadata.name ?? ""} ${metadata.serviceDescription ?? ""}`;
  return new RegExp(`(^|\\D)${configuredYear}(\\D|$)`).test(title);
}

export async function loadCwdSamplingGate(
  layer: LayerDefinition,
  request: CwdGateRequest,
): Promise<SeasonGate> {
  try {
    const item = await readJson(
      new URL(`/api/gis-proxy/dnr-gis-item/${itemId}`, absoluteBrowserUrl(layer.url)),
      request,
    );
    const service = await readJson(endpoint(layer, ""), request);
    const zonesUrl = endpoint(layer, "3/query");
    zonesUrl.searchParams.set("where", "1=1");
    zonesUrl.searchParams.set("outFields", "effperiod");
    zonesUrl.searchParams.set("returnDistinctValues", "true");
    zonesUrl.searchParams.set("returnGeometry", "false");
    const zones = await readJson(zonesUrl, request);
    const shownSitesUrl = endpoint(layer, "1/query");
    shownSitesUrl.searchParams.set(
      "where",
      typeof layer.options?.where === "string" ? layer.options.where : "show = 'Yes'",
    );
    shownSitesUrl.searchParams.set("returnGeometry", "false");
    shownSitesUrl.searchParams.set("resultRecordCount", "1");
    const shownSites = await readJson(shownSitesUrl, request);
    const editedSitesUrl = endpoint(layer, "1/query");
    editedSitesUrl.searchParams.set("where", "1=1");
    editedSitesUrl.searchParams.set("outFields", "last_edited_date");
    editedSitesUrl.searchParams.set("returnGeometry", "false");
    editedSitesUrl.searchParams.set("orderByFields", "last_edited_date DESC");
    editedSitesUrl.searchParams.set("resultRecordCount", "1");
    const editedSites = await readJson(editedSitesUrl, request);
    const layerMetadata = await readJson(endpoint(layer, "1"), request);
    const dates = (editedSites.features ?? []).map(({ attributes }) => Number(attributes?.last_edited_date));
    const newest = Math.max(...dates);
    const july = Date.UTC(configuredYear, 6, 1);
    const fields = new Set((layerMetadata.fields ?? []).map(({ name }) => name));
    const validSchema = layerMetadata.name === "wld_cwd_hunter_resource_sites_web"
      && expectedFields.every((field) => fields.has(field));
    const periods = (zones.features ?? []).map(({ attributes }) => attributes?.effperiod);
    const isCurrent = periods.length > 0
      && periods.every((period) => periodIsCurrent(period, request.now))
      && titleHasYear(item)
      && (shownSites.features?.length ?? 0) > 0
      && Number.isFinite(newest)
      && newest >= july
      && validSchema
      && service.layers?.some(({ id, name }) => id === 1 && name === "wld_cwd_hunter_resource_sites_web")
      && service.layers?.some(({ id, name }) => id === 3 && name === "wld_cwd_dpa_sampling_area_web");
    if (isCurrent) return { status: "current", label: configuredPeriod };
  } catch {
    // An unreachable or unreadable DNR endpoint cannot verify this season.
  }
  return unavailable(layer);
}
