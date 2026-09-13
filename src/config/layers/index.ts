import { beckerLayers } from "./counties/becker";
import { beltramiLayers } from "./counties/beltrami";
import { douglasLayers } from "./counties/douglas";
import { hubbardLayers } from "./counties/hubbard";
import { toddLayers } from "./counties/todd";
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
  ...hubbardLayers,
  ...beltramiLayers,
  ...beckerLayers,
  ...toddLayers,
  ...douglasLayers,
];

export type { LayerDefinition } from "./types";
