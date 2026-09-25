import type { LayerDefinition } from "@/config/layers";

// Vector layers are Cesium data sources, which always draw above every imagery layer.
const vectorBand = 4;

export function imageryStackBand(layer: LayerDefinition): number {
  if (layer.category === "basemap") return 0;
  if (layer.category === "imagery") return layer.county ? 2 : 1;
  return 3;
}

function stackBand(layer: LayerDefinition): number {
  const isVector = layer.sourceType === "arcgis-featureserver" || layer.sourceType === "geojson";
  return isVector ? vectorBand : imageryStackBand(layer);
}

// `layers` is in the order the map draws them, bottom first. Layers in the same band stay in
// that order, so the layer the user moved highest is drawn last and comes first here.
export function topmostFirst(layers: readonly LayerDefinition[]): LayerDefinition[] {
  return layers
    .map((layer, index) => ({ layer, index, band: stackBand(layer) }))
    .toSorted((first, second) => second.band - first.band || second.index - first.index)
    .map(({ layer }) => layer);
}
