import { countyRegistry } from "@/config/counties";
import { elevationLayers } from "./elevation";
import { imageryLayers } from "./imagery";
import { publicLandLayers } from "./publicLand";
import { statewideLayers } from "./statewide";
import type { LayerDefinition } from "./types";

export const layerRegistry: readonly LayerDefinition[] = [
  ...statewideLayers,
  ...imageryLayers,
  ...elevationLayers,
  ...publicLandLayers,
  ...countyRegistry.flatMap((county) => county.layers),
];

export type { LayerDefinition } from "./types";
