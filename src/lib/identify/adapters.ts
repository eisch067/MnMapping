import type { LayerSourceType } from "@/config/layers/types";
import { identifyLakeDepth } from "@/lib/dnr/lakeDepth";
import { identifyWetlandBuffer } from "@/lib/dnr/wetlandBuffer";
import { identifyFeatureServer } from "./featureServer";
import type { LayerIdentifyAdapter } from "./types";

// Every source type is listed so that adding one to the registry forces a decision here.
// A null entry means the source is imagery or terrain with nothing to report at a point. MapServer
// layers opt into identify through their source-specific adapter.
export const identifyAdapters: Record<LayerSourceType, LayerIdentifyAdapter | null> = {
  tms: null,
  wms: null,
  wmts: null,
  "arcgis-mapserver": identifyMapServer,
  "arcgis-imageserver": null,
  "arcgis-featureserver": identifyFeatureServer,
  geojson: null,
  "cesium-terrain": null,
  "arcgis-terrain": null,
};

async function identifyMapServer(
  layer: Parameters<typeof identifyLakeDepth>[0],
  context: Parameters<typeof identifyLakeDepth>[1],
) {
  if (layer.id.startsWith("mndnr-buffer-protection-") || layer.id === "mndnr-national-wetlands-inventory") {
    return identifyWetlandBuffer(layer, context);
  }
  if (layer.id === "mndnr-lake-depth-map") return identifyLakeDepth(layer, context);
  return [];
}
