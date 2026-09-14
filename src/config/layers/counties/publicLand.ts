import type { LayerBounds, LayerDefinition } from "../types";

const serviceUrl = "/api/gis-proxy/mngeo-features/us_mn_state_mngeo/plan_gov_own_open/MapServer";
const sourceUrl = "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_gov_own_open/MapServer/0";
const verifiedAt = "2026-09-14";

const countiesWithGovernmentOwnership = new Set([
  "001", "003", "005", "009", "011", "017", "019", "021", "023", "025", "027", "029", "031", "035",
  "037", "041", "045", "051", "053", "055", "059", "061", "063", "071", "073", "075", "077", "083",
  "085", "089", "095", "099", "101", "107", "109", "111", "113", "117", "119", "121", "123", "125",
  "129", "137", "139", "141", "147", "149", "155", "157", "161", "163", "167", "169", "171", "173",
]);

export function createMnGeoCountyPublicLandLayer(
  id: string,
  name: string,
  fips: string,
  bounds: LayerBounds,
): LayerDefinition | null {
  if (!countiesWithGovernmentOwnership.has(fips)) return null;
  return {
    id: `${id}-county-public-land`,
    name: `${name} county-owned & tax-forfeited parcels`,
    category: "public-land",
    sourceType: "arcgis-featureserver",
    url: serviceUrl,
    sourceUrl,
    defaultVisible: false,
    defaultOpacity: 0.82,
    attribution: "Minnesota Geospatial Information Office and contributing counties",
    agency: `${name} County data via MnGeo Open Data`,
    county: name,
    bounds,
    description: `Parcels classified by the contributing county as County Fee or Tax Forfeit. Ownership classification does not establish public recreational access; verify current county rules before entering. Verified ${verifiedAt}.`,
    accessMeaning: "access-varies",
    nameField: "govt_own",
    popupFields: [
      { field: "govt_own", label: "Ownership class" },
      { field: "county_pin", label: "County parcel ID" },
      { field: "co_name", label: "County" },
    ],
    options: {
      layerId: 0,
      where: `co_code='27${fips}' AND govt_own IN ('County Fee','Tax Forfeit')`,
      outFields: "county_pin,co_name,govt_own",
      fillColor: "#b58a3a",
      strokeColor: "#f0cf78",
      fillAlpha: 0.24,
      strokeWidth: 1.5,
      maxCameraHeight: 35_000,
    },
  };
}
