"use client";

import { useState } from "react";
import {
  isLayerAvailableAtCameraHeight,
  isTerrainLayer,
  type LayerCategory,
  type LayerDefinition,
} from "@/config/layers/types";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import { ActiveLayers } from "./layers/ActiveLayers";
import { CategorySection } from "./layers/CategorySection";
import type { SectionState } from "./layers/ImagerySection";
import type { LayerControls } from "./layers/LayerRow";
import { TerrainSection } from "./layers/TerrainSection";
import { categoryLabels, groupLayers, isLayerVisible } from "./layers/layerGrouping";
import { useLayerTransfer, usageFor } from "./layers/useLayerTransfer";

export interface LayerDrawerProps extends LayerControls {
  layers: readonly LayerDefinition[];
  terrainExaggeration: number;
  onTerrainExaggerationChange: (exaggeration: number) => void;
  externalImagery: readonly RestrictedImagerySource[];
  pendingParcelCounties: readonly string[];
  pendingPublicLandCounties: readonly string[];
}

const initiallyCollapsed = [
  "terrain",
  "imagery-county",
  "imagery-statewide",
  "imagery-statewide-naip",
  "imagery-statewide-cir",
  ...Object.keys(categoryLabels),
];

function useSectionState(): SectionState {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(initiallyCollapsed));
  return {
    isCollapsed: (id) => collapsed.has(id),
    toggle: (id) =>
      setCollapsed((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
  };
}

// A category with no layers still appears while a visible county's data is pending,
// so the note explaining the gap has somewhere to go.
function categoriesFor(props: LayerDrawerProps): Map<LayerCategory, LayerDefinition[]> {
  const categories = groupLayers(props.layers.filter((layer) => !isTerrainLayer(layer)));
  if (props.pendingParcelCounties.length > 0 && !categories.has("parcels"))
    categories.set("parcels", []);
  if (props.pendingPublicLandCounties.length > 0 && !categories.has("public-land"))
    categories.set("public-land", []);
  return categories;
}

function pendingCountiesFor(category: LayerCategory, props: LayerDrawerProps): readonly string[] {
  if (category === "parcels") return props.pendingParcelCounties;
  if (category === "public-land") return props.pendingPublicLandCounties;
  return [];
}

export function LayerDrawer(props: LayerDrawerProps) {
  const { layers, state, cameraHeight } = props;
  const sections = useSectionState();
  const transferByLayer = useLayerTransfer(layers, state);
  const terrainLayers = layers.filter(isTerrainLayer);
  const categories = categoriesFor(props);
  const visibleLayers = layers
    .filter((layer) => isLayerVisible(layer, state))
    .filter((layer) => isLayerAvailableAtCameraHeight(layer, cameraHeight))
    .toSorted(
      (left, right) =>
        usageFor(transferByLayer, right).bytes - usageFor(transferByLayer, left).bytes,
    );
  const controls: LayerControls = props;

  return (
    <>
      <p className="panel-note">Choose what appears on the map and arrange the display order.</p>
      {terrainLayers.length > 0 && (
        <TerrainSection
          layers={terrainLayers}
          state={state}
          exaggeration={props.terrainExaggeration}
          onVisibilityChange={props.onVisibilityChange}
          onExaggerationChange={props.onTerrainExaggerationChange}
          expanded={!sections.isCollapsed("terrain")}
          onToggleExpand={() => sections.toggle("terrain")}
        />
      )}
      <div className="layer-categories">
        {Array.from(categories, ([category, categoryLayers]) => (
          <CategorySection
            key={category}
            category={category}
            layers={categoryLayers}
            controls={controls}
            sections={sections}
            externalImagery={props.externalImagery}
            pendingCounties={pendingCountiesFor(category, props)}
          />
        ))}
      </div>
      <ActiveLayers
        visibleLayers={visibleLayers}
        categories={categories}
        terrainLayers={terrainLayers}
        transferByLayer={transferByLayer}
        onVisibilityChange={props.onVisibilityChange}
      />
    </>
  );
}
