import type { LayerDefinition } from "@/config/layers";
import type { IdentifyContext, IdentifyResult } from "@/lib/identify/types";
import { fetchJson, throwForArcGisError, type ArcGisError } from "@/lib/map/arcgisFeatures";
import { absoluteBrowserUrl } from "@/lib/map/layerOptions";
import { dnrAttribution, meaningStatements } from "./meaning";

interface QueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: ArcGisError;
}

interface MapLayerField {
  field: string;
  label: string;
}

interface MapLayerSpec {
  layerId: number;
  titleField: string;
  fields: readonly MapLayerField[];
  nearbyMeters?: number;
  note: string;
}

const nwi: MapLayerSpec = {
  layerId: 0,
  titleField: "wetland_type",
  fields: [
    { field: "attribute", label: "Cowardin code" },
    { field: "wetland_type", label: "Wetland type" },
    { field: "acres", label: "Acres" },
    { field: "hgm_desc", label: "Hydrogeomorphic class" },
    { field: "spcc_desc", label: "Special modifier" },
    { field: "cow_class1", label: "Cowardin class" },
    { field: "circ39_class", label: "Circular 39 class" },
  ],
  note: "Mapped from 2009–2014 imagery; not current conditions.",
};

const bufferLines: MapLayerSpec = {
  layerId: 1,
  titleField: "description",
  fields: [
    { field: "description", label: "Water" },
    { field: "buffer_ft", label: "Minimum state buffer" },
    { field: "dnr_sl_cla", label: "DNR classification" },
    { field: "field_review", label: "Field review" },
    { field: "potential_trout_delisting", label: "Potential trout delisting" },
  ],
  nearbyMeters: 15,
  note: "Statewide revision of August 2019; mapped water line is not a surveyed buffer edge.",
};

const bufferBasins: MapLayerSpec = {
  ...bufferLines,
  layerId: 2,
  titleField: "pw_basin_name",
  note: "Statewide revision of August 2019; basin outline is not a surveyed buffer edge.",
  fields: [
    { field: "pw_basin_name", label: "Water" },
    { field: "buffer_ft", label: "Minimum state buffer" },
    { field: "dnr_sl_class", label: "DNR classification" },
    { field: "dow_lake_number", label: "DOW lake number" },
  ],
  nearbyMeters: undefined,
};


const links = {
  wetland: [
    { label: "DNR wetlands information", href: "https://www.dnr.state.mn.us/wetlands/index.html" },
  ],
  buffer: [
    { label: "DNR Buffer Mapping Project", href: "https://www.dnr.state.mn.us/buffers/index.html" },
    { label: "BWSR Minnesota Buffer Law", href: "https://bwsr.state.mn.us/minnesota-buffer-law" },
    { label: "Minn. Stat. 103F.48", href: "https://www.revisor.mn.gov/statutes/cite/103F.48" },
  ],
};

function specFor(layer: LayerDefinition): MapLayerSpec | undefined {
  if (layer.id === "mndnr-national-wetlands-inventory") return nwi;
  if (layer.id === "mndnr-buffer-protection-lines") return bufferLines;
  if (layer.id === "mndnr-buffer-protection-basins") return bufferBasins;
  return undefined;
}

function queryUrl(layer: LayerDefinition, spec: MapLayerSpec, context: IdentifyContext): URL {
  const { longitude, latitude, toleranceMeters } = context.point;
  const url = new URL(`${absoluteBrowserUrl(layer.url)}/${spec.layerId}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", spec.fields.map(({ field }) => field).join(","));
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("geometry", `${longitude},${latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  if (spec.nearbyMeters && toleranceMeters > 0) {
    url.searchParams.set("distance", String(spec.nearbyMeters));
    url.searchParams.set("units", "esriSRUnit_Meter");
    url.searchParams.set("resultRecordCount", "10");
  }
  url.searchParams.set("f", "json");
  return url;
}

function resultFor(
  layer: LayerDefinition,
  spec: MapLayerSpec,
  attributes: Record<string, unknown>,
  index: number,
): IdentifyResult {
  const title = String(attributes[spec.titleField] ?? layer.name);
  const rows = spec.fields.flatMap(({ field, label }) => {
    const value = attributes[field];
    return value === null || value === undefined || value === "" ? [] : [{ label, value: String(value) }];
  });
  const nwiResult = layer.id === "mndnr-national-wetlands-inventory";
  const meaningClass = nwiResult ? "inventory-reference" : "regulatory-guide";
  return {
    id: `${layer.id}:${index}`,
    kind: "layer",
    sourceName: layer.name,
    title,
    rows,
    notes: [meaningStatements[meaningClass], spec.note],
    links: nwiResult ? links.wetland : links.buffer,
    attribution: dnrAttribution,
  };
}

export async function identifyWetlandBuffer(
  layer: LayerDefinition,
  context: IdentifyContext,
): Promise<IdentifyResult[]> {
  const spec = specFor(layer);
  if (!spec) return [];
  const url = queryUrl(layer, spec, context);
  const response = await fetchJson<QueryResponse>(url, context.fetcher, context.signal);
  throwForArcGisError(response.error, url);
  return (response.features ?? []).map(({ attributes = {} }, index) =>
    resultFor(layer, spec, attributes, index),
  );
}
