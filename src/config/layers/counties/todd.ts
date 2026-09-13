import type { LayerDefinition } from "../types";

const proxyRoot = "/api/gis-proxy/todd/Imagery";
const sourceRoot = "https://gis.mytoddcounty.com/toddcounty/rest/services/Imagery";

const vintages = [
  { service: "2020County", year: 2020, scope: "County", resolution: "Not published", season: "Not published" },
  { service: "2018City", year: 2018, scope: "Cities", resolution: "4 inches", season: "Spring (April)" },
  { service: "2017County", year: 2017, scope: "County", resolution: "9 inches", season: "Spring (April–May)" },
  { service: "2013City", year: 2013, scope: "Cities", resolution: "6 inches", season: "Spring (April–May)" },
  { service: "2013County", year: 2013, scope: "County", resolution: "9 inches", season: "Spring (May)" },
  { service: "2008County", year: 2008, scope: "County", resolution: "12 inches", season: "Not published" },
] as const;

export const toddLayers: LayerDefinition[] = vintages.map((vintage) => ({
  id: `todd-imagery-${vintage.year}-${vintage.scope.toLowerCase()}`,
  name: `${vintage.year} Todd ${vintage.scope}`,
  category: "imagery",
  sourceType: "arcgis-mapserver",
  url: `${proxyRoot}/${vintage.service}/MapServer`,
  sourceUrl: `${sourceRoot}/${vintage.service}/MapServer`,
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Todd County GIS / Pictometry",
  agency: "Todd County GIS; imagery by Pictometry",
  county: "Todd",
  year: vintage.year,
  resolution: vintage.resolution,
  description: `${vintage.season} ${vintage.scope.toLowerCase()} acquisition. Dynamic export is used because the published tile cache uses a county coordinate system.`,
  options: { enablePickFeatures: false, usePreCachedTilesIfAvailable: false },
}));
