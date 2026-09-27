import type { LayerSourceType } from "@/config/layers/types";
import { identifyFeatureServer } from "./featureServer";
import type { LayerIdentifyAdapter } from "./types";

// Every source type is listed so that adding one to the registry forces a decision here.
// A null entry means the source is imagery or terrain with nothing to report at a point.
export const identifyAdapters: Record<LayerSourceType, LayerIdentifyAdapter | null> = {
  tms: null,
  wms: null,
  wmts: null,
  "arcgis-mapserver": null,
  "arcgis-imageserver": null,
  "arcgis-featureserver": identifyFeatureServer,
  geojson: null,
  "cesium-terrain": null,
  "arcgis-terrain": null,
};
