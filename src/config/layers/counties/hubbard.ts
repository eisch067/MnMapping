import type { LayerDefinition } from "../types";

const proxyRoot = "/api/gis-proxy/hubbard/Imagery";
const sourceRoot = "https://gis.co.hubbard.mn.us/arcgis/rest/services/Imagery";

const vintages = [
  { service: "2026_Imagery", year: 2026, resolution: "6 inches", season: "Spring" },
  { service: "2023_Imagery", year: 2023, resolution: "Mixed 6 and 9 inches", season: "Spring" },
  { service: "2020_Imagery", year: 2020, resolution: "3 inches", season: "Summer" },
  { service: "2017_Imagery", year: 2017, resolution: "9 inches", season: "Spring" },
  { service: "2013_2014_SAIP_Imagery", year: "2013–2014", resolution: "Not published", season: "Not published" },
  { service: "2011_Imagery", year: 2011, resolution: "9 inches", season: "Spring" },
] as const;

export const hubbardLayers: LayerDefinition[] = vintages.map((vintage) => ({
  id: `hubbard-imagery-${String(vintage.year).replace("–", "-")}`,
  name: `${vintage.year} Hubbard County`,
  category: "imagery",
  sourceType: "arcgis-mapserver",
  url: `${proxyRoot}/${vintage.service}/MapServer`,
  sourceUrl: `${sourceRoot}/${vintage.service}/MapServer`,
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Hubbard County GIS",
  agency: "Hubbard County GIS",
  county: "Hubbard",
  year: vintage.year,
  resolution: vintage.resolution,
  description: `${vintage.season} acquisition. Official county cached imagery service.`,
  options: { enablePickFeatures: false },
}));
