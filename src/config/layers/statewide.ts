import type { LayerDefinition } from "./types";

export const statewideLayers: LayerDefinition[] = [
  {
    id: "natural-earth",
    name: "Natural Earth",
    category: "basemap",
    sourceType: "tms",
    url: "/cesium/Assets/Textures/NaturalEarthII",
    defaultVisible: true,
    defaultOpacity: 1,
    attribution: "Natural Earth II imagery bundled with CesiumJS",
    description: "Offline, low-resolution starter basemap. Statewide imagery is added in Step 03.",
  },
];
