import type { LayerDefinition } from "../types";

const imageryUrl = "/api/gis-proxy/mngeo-imagery/wmsll?";
const countyBounds = { west: -93.82, south: 46.15, east: -93.04, north: 47.03 } as const;

const imageryLayers: LayerDefinition[] = [
  { id: "aitkin-imagery-fall-2011", name: "2011 Aitkin Fall", layer: "fall11", color: "natural-color" },
  { id: "aitkin-imagery-fall-cir-2011", name: "2011 Aitkin Fall CIR", layer: "fallcir11", color: "color-infrared" },
].map(({ id, name, layer, color }) => ({
  id,
  name,
  category: "imagery",
  sourceType: "wms",
  url: imageryUrl,
  defaultVisible: false,
  defaultOpacity: 1,
  minimumLevel: 5,
  bounds: countyBounds,
  attribution: "Minnesota DNR fall imagery via MnGeo",
  agency: "Minnesota Department of Natural Resources; hosted by MnGeo",
  county: "Aitkin",
  year: 2011,
  resolution: "0.5 meter",
  description: `Fall 2011 ${color} imagery covering Aitkin County. Service and coverage verified 2026-09-14.`,
  options: { layers: layer, format: "image/jpeg", transparent: false, version: "1.1.1" },
}));

const parcelLayer: LayerDefinition = {
  id: "aitkin-parcels",
  name: "Aitkin tax parcels",
  category: "parcels",
  sourceType: "arcgis-featureserver",
  url: "https://gisweb.co.aitkin.mn.us/arcgis/rest/services/ParcelTaxData/FeatureServer",
  sourceUrl: "https://gisweb.co.aitkin.mn.us/arcgis/rest/services/ParcelTaxData/FeatureServer/0",
  defaultVisible: false,
  defaultOpacity: 0.8,
  attribution: "Aitkin County GIS",
  agency: "Aitkin County GIS",
  county: "Aitkin",
  bounds: countyBounds,
  description: "Official, public Aitkin County tax-parcel geometry and assessment attributes. The service is queried only for the visible parcel-scale extent. Verified 2026-09-14.",
  nameField: "PRINT_KEY",
  parcelFields: {
    parcelId: "PRINT_KEY",
    owner: "OWNNAME",
    siteAddress: "Physical_Address",
    mailingAddress: "OWN_ADDR_1",
    acres: "DEEDED_ACRES",
    legalDescription: "LEGAL",
    assessedValue: "ESTTOTVAL",
    taxYear: "TAX_YR",
  },
  options: {
    layerId: 0,
    outFields: "PRINT_KEY,OWNNAME,Physical_Address,OWN_ADDR_1,DEEDED_ACRES,LEGAL,ESTTOTVAL,TAX_YR",
    fillColor: "#ffffff",
    strokeColor: "#f2d48a",
    fillAlpha: 0.01,
    strokeWidth: 1,
    maxCameraHeight: 35000,
  },
};

export const aitkinLayers: LayerDefinition[] = [...imageryLayers, parcelLayer];
