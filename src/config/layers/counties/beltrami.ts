import type { LayerDefinition } from "../types";

const sourceUrl = "https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?";

const vintages = [
  { layer: "belt23", year: 2023, resolution: "9 inches", coverage: { west: -95.65, south: 47.35, east: -94.34, north: 48.59 } },
  { layer: "belt20", year: 2020, resolution: "9 inches", coverage: { west: -95.65, south: 47.35, east: -94.35, north: 48.59 } },
  { layer: "polk", year: 2014, resolution: "1 foot", coverage: { west: -97.23, south: 47.31, east: -94.28, north: 48.59 } },
] as const;

const imageryLayers: LayerDefinition[] = vintages.map((vintage) => ({
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

const parcelLayer: LayerDefinition = {
  id: "beltrami-parcels",
  name: "Beltrami tax parcels",
  category: "parcels",
  sourceType: "arcgis-featureserver",
  url: "/api/gis-proxy/beltrami/BeltramiData/BeltramiOpenData/FeatureServer",
  sourceUrl: "https://arcgis.co.beltrami.mn.us/arcgis/rest/services/BeltramiData/BeltramiOpenData/FeatureServer/2",
  defaultVisible: false,
  defaultOpacity: 0.8,
  attribution: "Beltrami County, Minnesota",
  agency: "Beltrami County GIS",
  county: "Beltrami",
  bounds: { west: -95.52, south: 47.39, east: -94.35, north: 48.56 },
  description: "Official county tax-parcel polygons. The anonymous service, layer 2, 41,646-record count, fields, pagination, and bounded WGS84 GeoJSON geometry were verified 2026-09-14.",
  nameField: "PIN",
  parcelFields: { parcelId: "PIN", owner: "OWNERNAME1", secondaryOwner: "OWNERNAME2", siteAddress: "PROP_ADD1", mailingAddress: "OWNER1_ADD", acres: "ACRES_DEED", legalDescription: "LEGAL_DESC", assessedValue: "EMV_TTL", taxYear: "PARCEL_YR" },
  options: { layerId: 2, outFields: "PIN,OWNERNAME1,OWNERNAME2,PROP_ADD1,OWNER1_ADD,ACRES_DEED,LEGAL_DESC,EMV_TTL,PARCEL_YR", fillColor: "#ffffff", strokeColor: "#f2d48a", fillAlpha: 0.01, strokeWidth: 1, maxCameraHeight: 35_000 },
};

const parksLayer: LayerDefinition = {
  id: "beltrami-county-parks",
  name: "Beltrami County Parks",
  category: "public-land",
  sourceType: "arcgis-featureserver",
  url: "/api/gis-proxy/beltrami/BeltramiData/BeltramiOpenData/FeatureServer",
  sourceUrl: "https://arcgis.co.beltrami.mn.us/arcgis/rest/services/BeltramiData/BeltramiOpenData/FeatureServer/12",
  defaultVisible: false,
  defaultOpacity: 0.82,
  attribution: "Beltrami County, Minnesota",
  agency: "Beltrami County GIS",
  county: "Beltrami",
  bounds: { west: -95.52, south: 47.39, east: -94.35, north: 48.56 },
  description: "Eight county-park polygons published by Beltrami County. Layer 12, fields, geometry type, query support, and record count were verified 2026-09-14. Verify current park rules and closures before visiting.",
  accessMeaning: "public-access",
  nameField: "NAME",
  popupFields: [{ field: "NAME", label: "Park" }, { field: "TYPE", label: "Type" }, { field: "OWNER", label: "Owner" }, { field: "ACRES", label: "Acres" }],
  options: { layerId: 12, outFields: "NAME,TYPE,OWNER,ACRES", fillColor: "#65b96e", strokeColor: "#c9f2cf", fillAlpha: 0.24, strokeWidth: 2 },
};

export const beltramiLayers: LayerDefinition[] = [...imageryLayers, parcelLayer, parksLayer];
