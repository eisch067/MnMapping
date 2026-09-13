import type { LayerDefinition } from "@/config/layers";

export interface LayerState {
  visible: boolean;
  opacity: number;
}

export type LayerStateById = Record<string, LayerState>;

export function createInitialLayerState(layers: readonly LayerDefinition[]): LayerStateById {
  return Object.fromEntries(
    layers.map((layer) => [
      layer.id,
      { visible: layer.defaultVisible, opacity: layer.defaultOpacity },
    ]),
  );
}
