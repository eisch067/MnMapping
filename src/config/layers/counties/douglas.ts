import type { LayerDefinition } from "../types";

const sourceUrl = "https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?";

const vintages = [
  { layer: "doug22", year: 2022, resolution: "2 inches", coverage: { west: -95.78, south: 45.74, east: -95.12, north: 46.13 } },
  { layer: "doug16", year: 2016, resolution: "3 inches", coverage: { west: -95.79, south: 45.74, east: -95.11, north: 46.13 } },
] as const;

export const douglasLayers: LayerDefinition[] = vintages.map((vintage) => ({
  id: `douglas-imagery-${vintage.year}`,
  name: `${vintage.year} Douglas County`,
  category: "imagery",
  sourceType: "wms",
  url: sourceUrl,
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Douglas County imagery via MnGeo",
  agency: "Douglas County; hosted by MnGeo",
  county: "Douglas",
  bounds: vintage.coverage,
  year: vintage.year,
  resolution: vintage.resolution,
  description: "Natural-color county imagery.",
  options: { layers: vintage.layer, format: "image/jpeg", transparent: false, version: "1.1.1" },
}));
