import type { LayerDefinition } from "../types";

const sourceUrl = "https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?";

const vintages = [
  { layer: "belt23", year: 2023, resolution: "9 inches", coverage: { west: -95.65, south: 47.35, east: -94.34, north: 48.59 } },
  { layer: "belt20", year: 2020, resolution: "9 inches", coverage: { west: -95.65, south: 47.35, east: -94.35, north: 48.59 } },
  { layer: "polk", year: 2014, resolution: "1 foot", coverage: { west: -97.23, south: 47.31, east: -94.28, north: 48.59 } },
] as const;

export const beltramiLayers: LayerDefinition[] = vintages.map((vintage) => ({
  id: `beltrami-imagery-${vintage.year}`,
  name: `${vintage.year} Beltrami County`,
  category: "imagery",
  sourceType: "wms",
  url: sourceUrl,
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Beltrami County imagery via MnGeo",
  agency: "Beltrami County; hosted by MnGeo",
  county: "Beltrami",
  bounds: vintage.coverage,
  year: vintage.year,
  resolution: vintage.resolution,
  description: vintage.year === 2014 ? "Natural-color coverage published jointly for Polk and Beltrami Counties." : "Natural-color county imagery.",
  options: { layers: vintage.layer, format: "image/jpeg", transparent: false, version: "1.1.1" },
}));
