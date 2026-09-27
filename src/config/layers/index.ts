import { countyRegistry } from "@/config/counties";
import { isPersonalMode } from "@/config/appMode";
import { dnrRecreationLayers } from "./dnrRecreation";
import { elevationLayers } from "./elevation";
import { imageryLayers } from "./imagery";
import { personalPublicLandLayers, publicLandLayers } from "./publicLand";
import { statewideLayers } from "./statewide";
import type { LayerDefinition } from "./types";

export const layerRegistry: readonly LayerDefinition[] = [
  ...statewideLayers,
  ...imageryLayers,
  ...elevationLayers,
  ...publicLandLayers,
  ...(isPersonalMode ? personalPublicLandLayers : []),
  // DNR data awaits DNR confirmation before any public release, so only the personal build lists it.
  ...(isPersonalMode ? dnrRecreationLayers : []),
  ...countyRegistry.flatMap((county) => county.layers),
];

export type { LayerDefinition } from "./types";
