import type { LayerDefinition } from "@/config/layers";

export interface LayerState {
  visible: boolean;
  opacity: number;
}

export type LayerStateById = Record<string, LayerState>;

// Layer ids a group control hid and will bring back, keyed by group id.
export type SuspendedByGroup = Record<string, readonly string[]>;

export interface LayerSelection {
  layers: LayerStateById;
  suspended: SuspendedByGroup;
}

export interface LayerPreferences extends LayerSelection {
  order: string[];
  verticalExaggeration: number;
}

const preferenceKey = "mnmapping.layer-preferences";
const preferencesVersion = 2;
// Preferences saved before they carried a version live under their own key.
const legacyPreferenceKey = "mnmapping.layer-preferences.v1";
const legacyOrderVersion = 2;

type StoredPreferences = Record<string, unknown>;

function createInitialLayerState(layers: readonly LayerDefinition[]): LayerStateById {
  return Object.fromEntries(
    layers.map((layer) => [
      layer.id,
      { visible: layer.defaultVisible, opacity: layer.defaultOpacity },
    ]),
  );
}

export function restoreLayerPreferences(layers: readonly LayerDefinition[]): LayerPreferences {
  const stored = readPreferences() ?? {};
  return {
    layers: restoreLayers(layers, stored.layers),
    suspended: restoreSuspended(stored.suspended, new Set(layers.map((layer) => layer.id))),
    order: restoreOrder(layers, stored.order),
    verticalExaggeration: restoreVerticalExaggeration(stored.verticalExaggeration),
  };
}

export function saveLayerPreferences(preferences: LayerPreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      preferenceKey,
      JSON.stringify({ version: preferencesVersion, ...preferences }),
    );
    window.localStorage.removeItem(legacyPreferenceKey);
  } catch {
    // Private browsing and storage policies can make localStorage unavailable.
  }
}

function restoreLayers(layers: readonly LayerDefinition[], stored: unknown): LayerStateById {
  const initial = createInitialLayerState(layers);
  if (!isRecord(stored)) return initial;
  for (const id of Object.keys(initial)) {
    const value = stored[id];
    if (!isRecord(value)) continue;
    const { visible, opacity } = value;
    if (typeof visible === "boolean" && typeof opacity === "number") {
      initial[id] = { visible, opacity: Math.min(1, Math.max(0, opacity)) };
    }
  }
  return initial;
}

function restoreSuspended(stored: unknown, knownIds: ReadonlySet<string>): SuspendedByGroup {
  if (!isRecord(stored)) return {};
  const groups = Object.entries(stored).map(([groupId, ids]): [string, string[]] => [
    groupId,
    [...new Set(knownStrings(ids, knownIds))],
  ]);
  return Object.fromEntries(groups.filter(([, ids]) => ids.length > 0));
}

function restoreOrder(layers: readonly LayerDefinition[], stored: unknown): string[] {
  const validIds = defaultLayerOrder(layers);
  return [...new Set([...knownStrings(stored, new Set(validIds)), ...validIds])];
}

function restoreVerticalExaggeration(stored: unknown): number {
  return typeof stored === "number" && stored >= 1 && stored <= 5 ? stored : 1;
}

function knownStrings(value: unknown, known: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && known.has(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Corrupt or unreadable storage is treated as no saved preferences.
function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function readPreferences(): StoredPreferences | null {
  if (typeof window === "undefined") return null;
  const current = readJson(preferenceKey);
  if (isRecord(current) && current.version === preferencesVersion) return current;
  const legacy = readJson(legacyPreferenceKey);
  return isRecord(legacy) ? migrateLegacyPreferences(legacy) : null;
}

// The layer order was reshaped once before versions existed, so an order saved under any other
// scheme is dropped rather than trusted.
function migrateLegacyPreferences(legacy: StoredPreferences): StoredPreferences {
  const { orderVersion, order, ...rest } = legacy;
  return orderVersion === legacyOrderVersion ? { ...rest, order } : rest;
}

function defaultLayerOrder(layers: readonly LayerDefinition[]): string[] {
  const imagery = layers
    .filter((layer) => layer.category === "imagery")
    .toSorted((first, second) => imageryYear(first) - imageryYear(second));
  let imageryIndex = 0;
  return layers.map((layer) =>
    layer.category === "imagery" ? imagery[imageryIndex++].id : layer.id,
  );
}

function imageryYear(layer: LayerDefinition): number {
  return typeof layer.year === "number" ? layer.year : Number.POSITIVE_INFINITY;
}
