import type { LayerSourceType } from "@/config/layers/types";
import { identifyLakeDepth } from "@/lib/dnr/lakeDepth";
import { identifyFeatureServer } from "./featureServer";
import type { LayerIdentifyAdapter } from "./types";

// Every source type is listed so that adding one to the registry forces a decision here.
// A null entry means the source is imagery or terrain with nothing to report at a point. A map
// service reports only where it is a DNR layer, and the one such layer is the Lake depth map.
export const identifyAdapters: Record<LayerSourceType, LayerIdentifyAdapter | null> = {
  tms: null,
  wms: null,
  wmts: null,
  "arcgis-mapserver": identifyLakeDepth,
  "arcgis-imageserver": null,
  "arcgis-featureserver": identifyFeatureServer,
  geojson: null,
  "cesium-terrain": null,
  "arcgis-terrain": null,
};
