import type { LayerDefinition } from "../types";

const sourceUrl = "https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?";

const vintages = [
  { layer: "doug22", year: 2022, resolution: "2 inches", coverage: { west: -95.78, south: 45.74, east: -95.12, north: 46.13 } },
  { layer: "doug16", year: 2016, resolution: "3 inches", coverage: { west: -95.79, south: 45.74, east: -95.11, north: 46.13 } },
] as const;

const imageryLayers: LayerDefinition[] = vintages.map((vintage) => ({
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

const parcelLayer: LayerDefinition = {
  id: "douglas-parcels",
  name: "Douglas tax parcels",
  category: "parcels",
  sourceType: "arcgis-featureserver",
  url: "/api/gis-proxy/douglas-open/Douglas_County_MN_Open_Data_Parcels/FeatureServer",
  sourceUrl: "https://services2.arcgis.com/8iQOd6RvhPL17pJd/arcgis/rest/services/Douglas_County_MN_Open_Data_Parcels/FeatureServer/0",
  defaultVisible: false,
  defaultOpacity: 0.8,
  attribution: "Douglas County, Minnesota",
  agency: "Douglas County Survey & GIS",
  county: "Douglas",
  description: "Official open-data parcel reference layer; it is not a survey and positional accuracy is not guaranteed. Loads only at parcel-scale zoom.",
  nameField: "PIN",
  parcelFields: { parcelId: "PIN", owner: "OWNRNAME", siteAddress: "TXPADR1", mailingAddress: "OWNRADDR1", acres: "GIS_ACRES", legalDescription: "TX_DSC_1_8" },
  options: { layerId: 0, outFields: "PIN,OWNRNAME,TXPADR1,OWNRADDR1,GIS_ACRES,TX_DSC_1_8", fillColor: "#ffffff", strokeColor: "#f2d48a", fillAlpha: 0.01, strokeWidth: 1, maxCameraHeight: 35000 },
};

export const douglasLayers: LayerDefinition[] = [...imageryLayers, parcelLayer];
