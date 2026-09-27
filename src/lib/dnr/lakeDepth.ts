import type { DnrLayerInfo, LayerDefinition } from "@/config/layers/types";
import type { IdentifyContext, IdentifyResult, IdentifyRow } from "@/lib/identify/types";
import { fetchJson, throwForArcGisError, type ArcGisError } from "@/lib/map/arcgisFeatures";
import { absoluteBrowserUrl } from "@/lib/map/layerOptions";
import { isDow } from "./lakefinder";
import { dnrAttribution, meaningStatements } from "./meaning";

// The bathymetry service's own layer numbers: contour lines and lake outlines.
const contourLayer = 0;
const outlineLayer = 1;
const nearbyContourLimit = 20;
const outlineFields = "dowlknum,lake_name,cty_name,acres,island";
const contourFields = "dowlknum,lake_name,abs_depth";

interface QueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: ArcGisError;
}

type Attributes = Record<string, unknown>;

interface DepthLake {
  dow: string;
  name?: string;
  county?: string;
  acres?: number;
  depths: Set<number>;
}

// A contour is a line, so it is found within the click distance rather than under the point.
function queryUrl(layer: LayerDefinition, layerId: number, context: IdentifyContext, fields: string) {
  const { longitude, latitude, toleranceMeters } = context.point;
  const url = new URL(`${absoluteBrowserUrl(layer.url)}/${layerId}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", fields);
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("geometry", `${longitude},${latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  if (layerId === contourLayer && toleranceMeters > 0) {
    url.searchParams.set("distance", String(Math.round(toleranceMeters)));
    url.searchParams.set("units", "esriSRUnit_Meter");
    url.searchParams.set("resultRecordCount", String(nearbyContourLimit));
  }
  url.searchParams.set("f", "json");
  return url;
}

async function attributesAt(url: URL, context: IdentifyContext): Promise<Attributes[]> {
  const response = await fetchJson<QueryResponse>(url, context.fetcher, context.signal);
  throwForArcGisError(response.error, url);
  return (response.features ?? []).map((feature) => feature.attributes ?? {});
}

function textOf(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function numberOf(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function lakeEntry(lakes: Map<string, DepthLake>, attributes: Attributes): DepthLake | undefined {
  const dow = textOf(attributes.dowlknum);
  if (dow === undefined || !isDow(dow)) return undefined;
  const existing = lakes.get(dow);
  if (existing) return existing;
  const created: DepthLake = { dow, name: textOf(attributes.lake_name), depths: new Set() };
  lakes.set(dow, created);
  return created;
}

function collectLakes(outlines: readonly Attributes[], contours: readonly Attributes[]): DepthLake[] {
  const lakes = new Map<string, DepthLake>();
  // An island polygon is land inside a lake, so a point on one is not on the lake.
  for (const outline of outlines.filter((entry) => entry.island !== "Y")) {
    const lake = lakeEntry(lakes, outline);
    if (!lake) continue;
    lake.county ??= textOf(outline.cty_name);
    lake.acres ??= numberOf(outline.acres);
  }
  for (const contour of contours) {
    const depth = numberOf(contour.abs_depth);
    const lake = lakeEntry(lakes, contour);
    if (lake && depth !== undefined) lake.depths.add(depth);
  }
  return [...lakes.values()];
}

function rowsFor(lake: DepthLake): IdentifyRow[] {
  const rows: IdentifyRow[] = [{ label: "DOW number", value: lake.dow }];
  if (lake.county) rows.push({ label: "County", value: lake.county });
  if (lake.acres !== undefined) rows.push({ label: "Acres", value: String(lake.acres) });
  if (lake.depths.size > 0) {
    const depths = [...lake.depths].sort((first, second) => first - second);
    rows.push({ label: "Contour depth", value: depths.map((depth) => `${depth} ft`).join(", ") });
  }
  return rows;
}

function resultFor(layer: LayerDefinition, dnr: DnrLayerInfo, lake: DepthLake): IdentifyResult {
  return {
    id: `${layer.id}:${lake.dow}`,
    kind: "layer",
    sourceName: layer.name,
    title: lake.name ?? `Lake ${lake.dow}`,
    rows: rowsFor(lake),
    notes: [meaningStatements[dnr.meaningClass], ...(dnr.caution ? [dnr.caution] : [])],
    links: [{ label: "About DNR lake maps", href: dnr.verifyUrl }],
    attribution: dnrAttribution,
    lake: { dow: lake.dow, name: lake.name },
  };
}

export async function identifyLakeDepth(
  layer: LayerDefinition,
  context: IdentifyContext,
): Promise<IdentifyResult[]> {
  const { dnr } = layer;
  if (!dnr) return [];
  const [outlines, contours] = await Promise.all([
    attributesAt(queryUrl(layer, outlineLayer, context, outlineFields), context),
    attributesAt(queryUrl(layer, contourLayer, context, contourFields), context),
  ]);
  return collectLakes(outlines, contours).map((lake) => resultFor(layer, dnr, lake));
}
