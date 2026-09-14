import type { LayerDefinition } from "./types";

const MNGEO_IMAGERY_WMS = "https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?";
const MINNESOTA_IMAGERY_BOUNDS = {
  west: -97.38,
  south: 43.37,
  east: -89.33,
  north: 49.4,
} as const;

export const imageryLayers: LayerDefinition[] = [
  {
    id: "mngeo-best-available",
    name: "Best Available",
    category: "imagery",
    sourceType: "wms",
    url: "https://imageserver.gisdata.mn.gov/cgi-bin/mncomp?",
    defaultVisible: true,
    defaultOpacity: 1,
    minimumLevel: 5,
    bounds: MINNESOTA_IMAGERY_BOUNDS,
    attribution: "MnGeo Composite Image Service",
    agency: "Minnesota Geospatial Information Office (MnGeo)",
    year: "Dynamic",
    resolution: "Varies by location and scale",
    description: "Automatically selects imagery using quality, resolution, recency, coverage, and season.",
    options: { layers: "mncomp", format: "image/jpeg", transparent: false, version: "1.1.1" },
  },
  ...[
    { year: 2025, resolution: "0.6 meter (approximately 2 feet)", layer: "fsa2025" },
    { year: 2023, resolution: "0.3 meter (approximately 1 foot)", layer: "fsa2023" },
    { year: 2021, resolution: "0.6 meter (approximately 2 feet)", layer: "fsa2021" },
  ].map(({ year, resolution, layer }): LayerDefinition => ({
    id: `mngeo-naip-${year}`,
    name: `${year} NAIP`,
    category: "imagery",
    sourceType: "wms",
    url: MNGEO_IMAGERY_WMS,
    defaultVisible: false,
    defaultOpacity: 1,
    minimumLevel: 5,
    bounds: MINNESOTA_IMAGERY_BOUNDS,
    attribution: "USDA Farm Service Agency via MnGeo",
    agency: "USDA Farm Service Agency; hosted by MnGeo",
    year,
    resolution,
    description: "Statewide summer natural-color National Agriculture Imagery Program imagery.",
    options: { layers: layer, format: "image/jpeg", transparent: false, version: "1.1.1" },
  })),
];
