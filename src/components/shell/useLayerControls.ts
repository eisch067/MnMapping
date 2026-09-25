"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { countyRegistry } from "@/config/counties";
import { layerRegistry } from "@/config/layers";
import { isTerrainLayer, type LayerDefinition } from "@/config/layers/types";
import { restrictedImageryForCounty } from "@/config/restrictedImagery";
import { latestDisplayableImagery } from "@/lib/countyImagery";
import {
  initialCountyForName,
  supportedCountiesInViewport,
  type MapLocation,
  type ViewportBounds,
} from "@/lib/location";
import { forgetSuspended, setLayerVisible, toggleGroup } from "@/lib/map/layerGroups";
import type { LayerRuntimeState, LayerRuntimeStateById } from "@/lib/map/layerRuntime";
import {
  restoreLayerPreferences,
  saveLayerPreferences,
  type LayerSelection,
  type LayerState,
  type LayerStateById,
} from "@/lib/map/layerState";
import type { LayerDrawerProps } from "./LayerDrawer";

const layerRegistryById = new Map(layerRegistry.map((layer) => [layer.id, layer]));
const imageryLayerIds = new Set(
  layerRegistry.filter((layer) => layer.category === "imagery").map((layer) => layer.id),
);
const terrainLayer = layerRegistry.find(isTerrainLayer);

function useLayerPreferences() {
  const [restored] = useState(() => restoreLayerPreferences(layerRegistry));
  const [selection, setSelection] = useState<LayerSelection>({
    layers: restored.layers,
    suspended: restored.suspended,
  });
  const [layerOrder, setLayerOrder] = useState(restored.order);
  const [verticalExaggeration, setVerticalExaggeration] = useState(restored.verticalExaggeration);

  useEffect(() => {
    saveLayerPreferences({ ...selection, order: layerOrder, verticalExaggeration });
  }, [layerOrder, selection, verticalExaggeration]);

  return {
    selection,
    setSelection,
    layerOrder,
    setLayerOrder,
    verticalExaggeration,
    setVerticalExaggeration,
  };
}

function useAreaLayers(
  location: MapLocation | null,
  viewportBounds: ViewportBounds | null,
  layerState: LayerStateById,
  layerOrder: readonly string[],
) {
  const selectedCounty = initialCountyForName(location?.county);
  const viewportCounties = useMemo(
    () =>
      viewportBounds
        ? supportedCountiesInViewport(viewportBounds)
        : selectedCounty
          ? [selectedCounty]
          : [],
    [selectedCounty, viewportBounds],
  );
  const pendingParcelCounties = useMemo(() => {
    const visibleCounties = new Set(viewportCounties);
    return countyRegistry
      .filter((county) => visibleCounties.has(county.name) && county.parcels.status === "pending")
      .map((county) => county.name);
  }, [viewportCounties]);
  const pendingPublicLandCounties = useMemo(() => {
    const visibleCounties = new Set(viewportCounties);
    // Minnesota's statewide government-ownership service (plan_gov_own_open) only covers 56 of
    // 87 counties today; there's no separate per-county source to fall back to yet, so this is
    // surfaced the same way an unverified parcel source is, rather than just silently omitting
    // the layer with no explanation.
    return countyRegistry
      .filter(
        (county) =>
          visibleCounties.has(county.name) &&
          !county.layers.some((layer) => layer.category === "public-land"),
      )
      .map((county) => county.name);
  }, [viewportCounties]);
  const externalImagery = useMemo(
    () => viewportCounties.flatMap((county) => restrictedImageryForCounty(county)),
    [viewportCounties],
  );
  const activeLayers = useMemo(() => {
    const countySet = new Set(viewportCounties);
    const order = new Map(layerOrder.map((id, index) => [id, index]));
    // A layer already turned on stays available even if the viewport's computed rectangle no
    // longer overlaps its county's bounding box (e.g. zoomed in tight near a shared border, or
    // a tilted terrain-view camera skewing the visible footprint) — that box check is only a
    // coarse proxy for "is this county relevant right now" and shouldn't silently undo an
    // explicit choice the user already made.
    return layerRegistry
      .filter(
        (layer) => !layer.county || countySet.has(layer.county) || layerState[layer.id]?.visible,
      )
      .toSorted((first, second) => (order.get(first.id) ?? 0) - (order.get(second.id) ?? 0));
  }, [layerOrder, viewportCounties, layerState]);

  return {
    viewportCounties,
    pendingParcelCounties,
    pendingPublicLandCounties,
    externalImagery,
    activeLayers,
  };
}

function useLayerRuntime() {
  const [runtimeState, setRuntimeState] = useState<LayerRuntimeStateById>({});
  const [retryVersion, setRetryVersion] = useState<Record<string, number>>({});
  const updateStatus = useCallback((id: string, status: LayerRuntimeState) => {
    setRuntimeState((current) => {
      const previous = current[id];
      const unchanged =
        previous?.status === status.status &&
        previous.message === status.message &&
        previous.featureCount === status.featureCount;
      return unchanged ? current : { ...current, [id]: status };
    });
  }, []);
  const retry = useCallback((id: string) => {
    setRetryVersion((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }, []);
  return { runtimeState, retryVersion, updateStatus, retry };
}

function findMoveTarget(
  activeLayers: readonly LayerDefinition[],
  id: string,
  direction: "up" | "down",
): LayerDefinition | undefined {
  const layer = activeLayers.find((candidate) => candidate.id === id);
  if (!layer) return undefined;
  const peers = activeLayers.filter(
    (candidate) =>
      candidate.category === layer.category &&
      !isTerrainLayer(candidate) &&
      (layer.category !== "imagery" || Boolean(candidate.county) === Boolean(layer.county)),
  );
  const peerIndex = peers.findIndex((candidate) => candidate.id === id);
  return peers[peerIndex + (direction === "up" ? 1 : -1)];
}

function swapIds(order: readonly string[], first: string, second: string): string[] {
  const next = [...order];
  const firstIndex = next.indexOf(first);
  const secondIndex = next.indexOf(second);
  [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
  return next;
}

// A fresh location search is a deliberate "start over," not incremental panning, so
// county-scoped layers reset to their defaults here — otherwise a layer left on near the
// previous search (kept visible even off-viewport by the edge-case fix in activeLayers)
// would keep rendering indefinitely after jumping somewhere unrelated.
// Group controls forget county-scoped layers for the same reason: restoring one would bring
// back a layer from the previous search. They also forget layers the reset just switched on.
function selectionForNewLocation(current: LayerSelection, location: MapLocation): LayerSelection {
  const latestImagery = location.county
    ? latestDisplayableImagery(location.county.replace(/\s+County$/i, ""))
    : undefined;
  const layers = Object.fromEntries(
    Object.entries(current.layers).map(([id, state]): [string, LayerState] => {
      if (imageryLayerIds.has(id))
        return [id, latestImagery ? { ...state, visible: id === latestImagery.id } : state];
      const layer = layerRegistryById.get(id);
      return layer?.county ? [id, { ...state, visible: layer.defaultVisible }] : [id, state];
    }),
  );
  return forgetSuspended(
    { ...current, layers },
    (id) => Boolean(layerRegistryById.get(id)?.county) || Boolean(layers[id]?.visible),
  );
}

export function useLayerControls(
  location: MapLocation | null,
  viewportBounds: ViewportBounds | null,
) {
  const {
    selection,
    setSelection,
    layerOrder,
    setLayerOrder,
    verticalExaggeration,
    setVerticalExaggeration,
  } = useLayerPreferences();
  const area = useAreaLayers(location, viewportBounds, selection.layers, layerOrder);
  const runtime = useLayerRuntime();

  const setVisible = (id: string, visible: boolean) => {
    setSelection((current) => setLayerVisible(current, id, visible));
  };
  const setOpacity = (id: string, opacity: number) => {
    setSelection((current) => ({
      ...current,
      layers: { ...current.layers, [id]: { ...current.layers[id], opacity } },
    }));
  };
  const toggleLayerGroup = (groupId: string, layerIds: readonly string[]) => {
    setSelection((current) => toggleGroup(current, groupId, layerIds));
  };
  const moveLayer = (id: string, direction: "up" | "down") => {
    const target = findMoveTarget(area.activeLayers, id, direction);
    if (target) setLayerOrder((current) => swapIds(current, id, target.id));
  };

  const drawer: Omit<LayerDrawerProps, "cameraHeight"> = {
    layers: area.activeLayers,
    state: selection.layers,
    suspended: selection.suspended,
    terrainExaggeration: verticalExaggeration,
    onVisibilityChange: setVisible,
    onToggleGroup: toggleLayerGroup,
    onOpacityChange: setOpacity,
    onTerrainExaggerationChange: setVerticalExaggeration,
    onMoveLayer: moveLayer,
    externalImagery: area.externalImagery,
    pendingParcelCounties: area.pendingParcelCounties,
    pendingPublicLandCounties: area.pendingPublicLandCounties,
    runtimeState: runtime.runtimeState,
    onRetryLayer: runtime.retry,
  };

  return {
    viewportCounties: area.viewportCounties,
    drawer,
    map: {
      layers: area.activeLayers,
      layerState: selection.layers,
      verticalExaggeration,
      retryVersion: runtime.retryVersion,
      onLayerStatusChange: runtime.updateStatus,
    },
    enableTerrain: () => {
      if (terrainLayer) setVisible(terrainLayer.id, true);
    },
    resetForLocation: (next: MapLocation) =>
      setSelection((current) => selectionForNewLocation(current, next)),
  };
}
