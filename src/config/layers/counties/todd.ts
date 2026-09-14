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

const imageryLayers: LayerDefinition[] = vintages.map((vintage) => ({
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

const parcelLayer: LayerDefinition = {
  id: "todd-parcels",
  name: "Todd tax parcels",
  category: "parcels",
  sourceType: "arcgis-featureserver",
  url: "/api/gis-proxy/todd/PublicViewerServer/MapServer",
  sourceUrl: "https://gis.mytoddcounty.com/toddcounty/rest/services/PublicViewerServer/MapServer/80",
  defaultVisible: false,
  defaultOpacity: 0.8,
  attribution: "Todd County GIS",
  agency: "Todd County GIS",
  county: "Todd",
  description: "Official public-viewer parcel geometry and published ownership attributes. Loads only at parcel-scale zoom.",
  nameField: "par_id",
  parcelFields: { parcelId: "par_id", owner: "OWNNAM", secondaryOwner: "OWNNAM2", siteAddress: "AD911RD", mailingAddress: "OWNERADD1", acres: "acres", legalDescription: "LEGAL1" },
  options: { layerId: 80, outFields: "par_id,OWNNAM,OWNNAM2,AD911RD,OWNERADD1,acres,LEGAL1", fillColor: "#ffffff", strokeColor: "#f2d48a", fillAlpha: 0.01, strokeWidth: 1, maxCameraHeight: 35000 },
};

const cityParksLayer: LayerDefinition = {
  id: "todd-city-parks",
  name: "Todd city parks",
  category: "public-land",
  sourceType: "arcgis-featureserver",
  url: "/api/gis-proxy/todd/PublicViewerServer/MapServer",
  sourceUrl: "https://gis.mytoddcounty.com/toddcounty/rest/services/PublicViewerServer/MapServer/240",
  defaultVisible: false,
  defaultOpacity: 0.8,
  attribution: "Todd County GIS",
  agency: "Todd County GIS",
  county: "Todd",
  description: "City park polygons published in Todd County's official public viewer.",
  accessMeaning: "access-varies",
  options: { layerId: 240, outFields: "*", fillColor: "#65b96e", strokeColor: "#c9f2cf", fillAlpha: 0.24, strokeWidth: 2 },
};

export const toddLayers: LayerDefinition[] = [...imageryLayers, cityParksLayer, parcelLayer];
