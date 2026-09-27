import type { LayerDefinition } from "@/config/layers";
import { fetchJson, throwForArcGisError, type ArcGisError } from "@/lib/map/arcgisFeatures";
import { absoluteBrowserUrl, booleanOption, stringOption } from "@/lib/map/layerOptions";
import { describeFeature } from "./featureDetails";
import type { IdentifyContext, IdentifyResult } from "./types";

interface FeatureQueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: ArcGisError;
}

// The same layer, filter, and fields the map draws, so an identify never reveals an attribute
// the layer's own popup would not.
// A layer of lines or points is hit within the click distance, since a fingertip cannot land on a
// line. Several can fall inside it, so the list is kept short.
const nearbyResultLimit = 10;

function pointQueryUrl(
  layer: LayerDefinition,
  { longitude, latitude, toleranceMeters }: IdentifyContext["point"],
) {
  const layerId = String(layer.options?.layerId ?? "0");
  const url = new URL(`${absoluteBrowserUrl(layer.url)}/${layerId}/query`);
  url.searchParams.set("where", stringOption(layer, "where") ?? "1=1");
  url.searchParams.set("outFields", stringOption(layer, "outFields") ?? "*");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("geometry", `${longitude},${latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  if (booleanOption(layer, "identifyNearby") && toleranceMeters > 0) {
    url.searchParams.set("distance", String(Math.round(toleranceMeters)));
    url.searchParams.set("units", "esriSRUnit_Meter");
    url.searchParams.set("resultRecordCount", String(nearbyResultLimit));
  }
  url.searchParams.set("f", "json");
  return url;
}

export async function identifyFeatureServer(
  layer: LayerDefinition,
  context: IdentifyContext,
): Promise<IdentifyResult[]> {
  const url = pointQueryUrl(layer, context.point);
  const response = await fetchJson<FeatureQueryResponse>(url, context.fetcher, context.signal);
  throwForArcGisError(response.error, url);
  return (response.features ?? []).map((feature, index) => ({
    id: `${layer.id}:${index}`,
    kind: "layer",
    sourceName: layer.name,
    ...describeFeature(layer, feature.attributes ?? {}),
  }));
}
