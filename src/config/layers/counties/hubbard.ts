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

const imageryLayers: LayerDefinition[] = vintages.map((vintage) => ({
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

const parcelLayer: LayerDefinition = {
  id: "hubbard-parcels",
  name: "Hubbard tax parcels",
  category: "parcels",
  sourceType: "arcgis-featureserver",
  url: "/api/gis-proxy/hubbard/OpenData/Hubbard_County_Tax_Parcels/FeatureServer",
  sourceUrl: "https://gis.co.hubbard.mn.us/arcgis/rest/services/OpenData/Hubbard_County_Tax_Parcels/FeatureServer/0",
  defaultVisible: false,
  defaultOpacity: 0.8,
  attribution: "Hubbard County GIS",
  agency: "Hubbard County GIS",
  county: "Hubbard",
  description: "Official tax-parcel geometry and published assessment attributes. Loads only at parcel-scale zoom.",
  nameField: "hubbgis_GIS_Parcels_PIN",
  parcelFields: { parcelId: "hubbgis_GIS_Parcels_PIN", owner: "PINAME1", secondaryOwner: "PINAME2", siteAddress: "PAADRLN1", mailingAddress: "PIADRLN1", acres: "hubbgis_GIS_Parcels_Acres", legalDescription: "LGDSC", taxYear: "PYPYEAR" },
  options: { layerId: 0, outFields: "hubbgis_GIS_Parcels_PIN,PINAME1,PINAME2,PAADRLN1,PIADRLN1,hubbgis_GIS_Parcels_Acres,LGDSC,PYPYEAR", fillColor: "#ffffff", strokeColor: "#f2d48a", fillAlpha: 0.01, strokeWidth: 1, maxCameraHeight: 35000 },
};

export const hubbardLayers: LayerDefinition[] = [...imageryLayers, parcelLayer];
