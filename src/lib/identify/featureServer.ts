import type { LayerDefinition } from "@/config/layers";
import { fetchJson, throwForArcGisError } from "@/lib/map/arcgisFeatures";
import { absoluteBrowserUrl, stringOption } from "@/lib/map/layerOptions";
import { describeFeature } from "./featureDetails";
import type { IdentifyContext, IdentifyResult } from "./types";

interface FeatureQueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: Parameters<typeof throwForArcGisError>[0];
}

// The same layer, filter, and fields the map draws, so an identify never reveals an attribute
// the layer's own popup would not.
function pointQueryUrl(layer: LayerDefinition, { longitude, latitude }: IdentifyContext["point"]) {
  const layerId = String(layer.options?.layerId ?? "0");
  const url = new URL(`${absoluteBrowserUrl(layer.url)}/${layerId}/query`);
  url.searchParams.set("where", stringOption(layer, "where") ?? "1=1");
  url.searchParams.set("outFields", stringOption(layer, "outFields") ?? "*");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("geometry", `${longitude},${latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
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
