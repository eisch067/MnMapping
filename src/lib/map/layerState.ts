import type { LayerDefinition } from "@/config/layers";

export interface LayerState {
  visible: boolean;
  opacity: number;
}

export type LayerStateById = Record<string, LayerState>;

const preferenceKey = "mnmapping.layer-preferences.v1";
const layerOrderVersion = 2;

interface StoredPreferences {
  layers?: LayerStateById;
  order?: string[];
  orderVersion?: number;
  verticalExaggeration?: number;
}

export function createInitialLayerState(layers: readonly LayerDefinition[]): LayerStateById {
  return Object.fromEntries(
    layers.map((layer) => [
      layer.id,
      { visible: layer.defaultVisible, opacity: layer.defaultOpacity },
    ]),
  );
}

export function restoreLayerState(layers: readonly LayerDefinition[]): LayerStateById {
  const initial = createInitialLayerState(layers);
  const stored = readPreferences()?.layers;
  if (!stored) return initial;
  for (const id of Object.keys(initial)) {
    const value = stored[id];
    if (typeof value?.visible === "boolean" && typeof value.opacity === "number") {
      initial[id] = { visible: value.visible, opacity: Math.min(1, Math.max(0, value.opacity)) };
    }
  }
  return initial;
}

export function restoreLayerOrder(layers: readonly LayerDefinition[]): string[] {
  const validIds = defaultLayerOrder(layers);
  const validIdSet = new Set(validIds);
  const preferences = readPreferences();
  const stored = preferences?.orderVersion === layerOrderVersion
    ? preferences.order?.filter((id) => validIdSet.has(id)) ?? []
    : [];
  return [...new Set([...stored, ...validIds])];
}

export function restoreVerticalExaggeration(): number {
  const stored = readPreferences()?.verticalExaggeration;
  return typeof stored === "number" && stored >= 1 && stored <= 5 ? stored : 1;
}

export function saveLayerPreferences(
  layers: LayerStateById,
  order: readonly string[],
  verticalExaggeration: number,
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(preferenceKey, JSON.stringify({ layers, order, orderVersion: layerOrderVersion, verticalExaggeration }));
  } catch {
    // Private browsing and storage policies can make localStorage unavailable.
  }
}

function readPreferences(): StoredPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(preferenceKey) ?? "null");
    return value && typeof value === "object" ? value as StoredPreferences : null;
  } catch {
    return null;
  }
}

function defaultLayerOrder(layers: readonly LayerDefinition[]): string[] {
  const imagery = layers
    .filter((layer) => layer.category === "imagery")
    .toSorted((first, second) => imageryYear(first) - imageryYear(second));
  let imageryIndex = 0;
  return layers.map((layer) => layer.category === "imagery" ? imagery[imageryIndex++].id : layer.id);
}

function imageryYear(layer: LayerDefinition): number {
  return typeof layer.year === "number" ? layer.year : Number.POSITIVE_INFINITY;
}
