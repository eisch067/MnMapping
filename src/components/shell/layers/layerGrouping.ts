import type { LayerCategory, LayerDefinition } from "@/config/layers/types";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import type { LayerStateById } from "@/lib/map/layerState";

export const categoryLabels: Record<LayerCategory, string> = {
  basemap: "Basemap",
  imagery: "Imagery",
  elevation: "Elevation",
  "public-land": "Public lands",
  parcels: "Parcels",
  reference: "Reference",
};

export function isLayerVisible(layer: LayerDefinition, state: LayerStateById): boolean {
  return state[layer.id]?.visible ?? layer.defaultVisible;
}

export function groupLayers(
  layers: readonly LayerDefinition[],
): Map<LayerCategory, LayerDefinition[]> {
  const categories = new Map<LayerCategory, LayerDefinition[]>();
  for (const layer of layers) {
    categories.set(layer.category, [...(categories.get(layer.category) ?? []), layer]);
  }
  return categories;
}

export function groupByCounty(layers: readonly LayerDefinition[]): Map<string, LayerDefinition[]> {
  const counties = new Map<string, LayerDefinition[]>();
  for (const layer of layers) {
    if (!layer.county) continue;
    counties.set(layer.county, [...(counties.get(layer.county) ?? []), layer]);
  }
  return new Map([...counties].toSorted(([first], [second]) => first.localeCompare(second)));
}

export function groupExternalImageryByCounty(
  sources: readonly RestrictedImagerySource[],
): Map<string, RestrictedImagerySource[]> {
  const counties = new Map<string, RestrictedImagerySource[]>();
  for (const source of sources)
    counties.set(source.county, [...(counties.get(source.county) ?? []), source]);
  return counties;
}

export function groupVisibleLayersByCategory(
  visibleLayers: readonly LayerDefinition[],
  categories: Map<LayerCategory, LayerDefinition[]>,
  terrainLayers: readonly LayerDefinition[],
): [string, LayerDefinition[]][] {
  const visibleIds = new Set(visibleLayers.map((layer) => layer.id));
  const groups: [string, LayerDefinition[]][] = [];
  const visibleTerrain = terrainLayers.filter((layer) => visibleIds.has(layer.id));
  if (visibleTerrain.length > 0) groups.push(["3D terrain", visibleTerrain]);
  for (const category of categories.keys()) {
    const layersInGroup = visibleLayers.filter((layer) => layer.category === category);
    if (layersInGroup.length > 0) groups.push([categoryLabels[category], layersInGroup]);
  }
  return groups;
}

export function averageOpacity(layers: readonly LayerDefinition[], state: LayerStateById): number {
  if (layers.length === 0) return 1;
  const total = layers.reduce(
    (sum, layer) => sum + (state[layer.id]?.opacity ?? layer.defaultOpacity),
    0,
  );
  return total / layers.length;
}

export function sortImageryNewestFirst(layers: readonly LayerDefinition[]): LayerDefinition[] {
  return [...layers].sort((left, right) => {
    const leftYear = typeof left.year === "number" ? left.year : Number.POSITIVE_INFINITY;
    const rightYear = typeof right.year === "number" ? right.year : Number.POSITIVE_INFINITY;
    return rightYear - leftYear;
  });
}

export function metadataLine(layer: LayerDefinition): string {
  return [layer.county ?? "Statewide", layer.year, layer.resolution, layer.attribution]
    .filter(Boolean)
    .join(" · ");
}

export function accessMeaningLabel(value: NonNullable<LayerDefinition["accessMeaning"]>): string {
  if (value === "public-access") return "Publicly accessible — verify current rules";
  if (value === "managed-land") return "Managed conservation land — restrictions may apply";
  if (value === "administrative-boundary") return "Unit boundary — not parcel ownership";
  return "Ownership interest and access vary";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
